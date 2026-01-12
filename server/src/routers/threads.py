import json
import uuid
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlmodel import col, select

from src.agent import build_agent
from src.auth import CurrentUser, check_permission, get_user_membership
from src.database import DatabaseSession, get_checkpoint_saver
from src.entities import Permission, Thread
from src.helpers import agent_messages_to_list, chunk_to_text, get_config
from src.schemas import CreateThreadRequest, RunPayload, ThreadResponse, UpdateThreadRequest

router = APIRouter(prefix="/organizations/{organization_id}/threads", tags=["threads"])

CheckpointSaverDep = Annotated[AsyncPostgresSaver, Depends(get_checkpoint_saver)]


@router.get("", response_model=List[ThreadResponse])
def list_threads(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 50,
):
    """Lista threads da organizacao (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_READ necessaria",
        )

    # Busca threads
    statement = (
        select(Thread)
        .where(Thread.organization_id == organization_id)
        .order_by(col(Thread.created_at).desc())
        .offset(offset)
        .limit(limit)
    )
    threads = db.exec(statement).all()

    return [
        ThreadResponse(
            id=t.id,
            title=t.title,
            created_by_id=t.created_by_id,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in threads
    ]


@router.post("", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    organization_id: uuid.UUID,
    payload: CreateThreadRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Cria uma nova thread (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Busca o membership do usuario
    membership = get_user_membership(db, current_user.id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao e membro desta organizacao",
        )

    # Cria a thread
    thread = Thread(
        organization_id=organization_id,
        created_by_id=membership.id,
        title=payload.title,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_by_id=thread.created_by_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


@router.get("/{thread_id}", response_model=ThreadResponse)
def get_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Retorna detalhes de uma thread (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_READ necessaria",
        )

    # Busca a thread
    thread = db.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_by_id=thread.created_by_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


@router.put("/{thread_id}", response_model=ThreadResponse)
def update_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    payload: UpdateThreadRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Atualiza uma thread (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Busca a thread
    thread = db.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )

    # Atualiza campos
    if payload.title is not None:
        thread.title = payload.title

    db.add(thread)
    db.commit()
    db.refresh(thread)

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_by_id=thread.created_by_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    organization_id: uuid.UUID,
    thread_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Deleta uma thread (requer THREADS_DELETE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_DELETE necessaria",
        )

    # Busca a thread
    thread = db.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )

    db.delete(thread)
    db.commit()

@router.get("/{thread_id}/state/messages")
async def get_thread_messages(
    organization_id: uuid.UUID, thread_id: str, checkpointer: CheckpointSaverDep
):
    agent = build_agent(checkpointer)
    state_snapshot = await agent.aget_state(config=get_config(thread_id))
    state_messages = state_snapshot.values.get("messages", [])
    return {"messages": agent_messages_to_list(state_messages)}


@router.post("/{thread_id}/runs/invoke")
async def invoke_run(
    organization_id: uuid.UUID,
    thread_id: str,
    payload: RunPayload,
    checkpointer: CheckpointSaverDep,
):
    agent = build_agent(checkpointer)
    messages = [m.to_agent() for m in payload.input.messages]
    state_values = await agent.ainvoke(
        {"messages": messages}, config=get_config(thread_id)
    )
    state_messages = state_values.get("messages", [])
    return {"messages": agent_messages_to_list(state_messages)}


@router.post("/{thread_id}/runs/stream")
async def stream_run(
    organization_id: uuid.UUID,
    thread_id: str,
    payload: RunPayload,
    checkpointer: CheckpointSaverDep,
):
    agent = build_agent(checkpointer)
    config = get_config(thread_id)
    messages = [m.to_agent() for m in payload.input.messages]

    def sse_response_payload(data: Dict[str, Any]) -> str:
        """Formato básico text/event-stream."""
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_iterator():
        """Traduz eventos do LangGraph em mensagens SSE (chunk/final/done)."""
        try:
            # Primeiro: faz streaming dos chunks para o frontend
            async for event in agent.astream_events(
                {"messages": messages},
                config=config,
            ):
                event_name = event.get("event")
                if event_name == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    text = chunk_to_text(chunk) if chunk is not None else ""
                    if not text:
                        continue
                    # Cada pedaço do modelo vira um evento chunk no SSE
                    yield sse_response_payload({"event": "chunk", "text": text})

            # IMPORTANTE: O loop acima só termina quando astream_events() completar TOTALMENTE,
            # incluindo a persistência no checkpointer. Não damos break antecipado.

            # Agora sim, busca as mensagens já salvas no checkpointer
            state_snapshot = await agent.aget_state(config=config)
            state_messages = state_snapshot.values.get("messages", [])

            # Evento final entrega o histórico completo já salvo no Postgres/checkpointer
            yield sse_response_payload(
                {
                    "event": "final",
                    "messages": agent_messages_to_list(state_messages),
                }
            )
            # Evento done apenas sinaliza encerramento da stream
            yield sse_response_payload({"event": "done"})
        except Exception as exc:
            print(exc)
            yield sse_response_payload({"event": "error", "detail": str(exc)})

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        event_iterator(), media_type="text/event-stream", headers=headers
    )
