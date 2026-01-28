import json
import uuid
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.agents.tools import get_tool_display_name
from src.auth import CurrentMembershipDependency, CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission
from .helpers import agent_messages_to_list, chunk_to_text, is_tool_call_chunk
from .schemas import RunRequest

from .schemas import CreateThreadRequest, ThreadMessagesResponse, ThreadResponse, UpdateThreadRequest
from .service import (
    create_thread as create_thread_service,
    delete_thread as delete_thread_service,
    get_thread as get_thread_service,
    get_thread_messages as get_thread_messages_service,
    list_threads as list_threads_service,
    prepare_stream_run,
    update_thread as update_thread_service,
)

router = APIRouter(prefix="/organizations/{organization_id}/threads", tags=["threads"])


def _check_permission(db, user_id, organization_id, permission):
    if not check_permission(db, user_id, organization_id, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permissao {permission.value} necessaria",
        )


@router.get("", response_model=List[ThreadResponse])
def list_threads(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    membership: CurrentMembershipDependency,
    db: DatabaseDependency,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 50,
):
    """Lista threads do usuario na organizacao (requer THREADS_READ)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_READ)
    return list_threads_service(organization_id, membership.id, db, offset, limit)


@router.post("", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    organization_id: uuid.UUID,
    payload: CreateThreadRequest,
    current_user: CurrentUserDependency,
    membership: CurrentMembershipDependency,
    db: DatabaseDependency,
):
    """Cria uma nova thread (requer THREADS_WRITE)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE)
    return create_thread_service(organization_id, membership.id, payload.title, db)


@router.get("/{thread_id}", response_model=ThreadResponse)
def get_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Retorna detalhes de uma thread (requer THREADS_READ)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_READ)
    return get_thread_service(organization_id, thread_id, db)


@router.put("/{thread_id}", response_model=ThreadResponse)
def update_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    payload: UpdateThreadRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza uma thread (requer THREADS_WRITE)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE)
    return update_thread_service(organization_id, thread_id, payload.title, db)


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Deleta uma thread (requer THREADS_DELETE)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_DELETE)
    delete_thread_service(organization_id, thread_id, db)


@router.get("/{thread_id}/state/messages", response_model=ThreadMessagesResponse)
async def get_thread_messages(
    organization_id: uuid.UUID,
    thread_id: str,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Retorna mensagens de uma thread (requer THREADS_READ)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_READ)
    return await get_thread_messages_service(thread_id)


@router.post("/{thread_id}/runs/stream")
async def stream_run(
    organization_id: uuid.UUID,
    thread_id: str,
    payload: RunRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Executa com streaming SSE (requer THREADS_WRITE)."""
    _check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE)

    agent, thread_config, messages, agent_context = prepare_stream_run(
        organization_id, thread_id, payload, current_user, db,
    )

    def sse_response_payload(data: Dict[str, Any]) -> str:
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_iterator():
        """Traduz eventos do LangGraph em mensagens SSE (chunk/final/done)."""
        try:
            active_tools = 0
            tools_ever_called = False

            async for event in agent.astream_events(
                {"messages": messages},
                config=thread_config,
                context=agent_context,
            ):
                event_name = event.get("event")

                if event_name == "on_tool_start":
                    active_tools += 1
                    tools_ever_called = True
                    tool_name = event.get("name", "")
                    display_name = get_tool_display_name(tool_name)
                    yield sse_response_payload({"event": "status", "content": f"{display_name}..."})
                    continue

                if event_name == "on_tool_end":
                    active_tools = max(0, active_tools - 1)
                    if active_tools == 0:
                        yield sse_response_payload({"event": "status", "content": ""})
                    continue

                if event_name == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk is None:
                        continue
                    if is_tool_call_chunk(chunk):
                        continue
                    if active_tools > 0:
                        continue
                    text = chunk_to_text(chunk)
                    if not text:
                        continue
                    if tools_ever_called and text.strip().startswith("{"):
                        continue
                    yield sse_response_payload({"event": "chunk", "content": text})

            state_snapshot = await agent.aget_state(config=thread_config)
            state_messages = state_snapshot.values.get("messages", [])

            messages_response = [m.model_dump(by_alias=True) for m in agent_messages_to_list(state_messages)]
            yield sse_response_payload({"event": "final", "messages": messages_response})
            yield sse_response_payload({"event": "done"})
        except Exception as exc:
            print(exc)
            yield sse_response_payload({"event": "error", "detail": str(exc)})

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(event_iterator(), media_type="text/event-stream", headers=headers)
