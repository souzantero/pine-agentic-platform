import json
import uuid
from datetime import UTC, datetime
from typing import Annotated, Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from sqlmodel import col, select

from src.agent import build_agent
from src.auth import CurrentMembership, CurrentUser, check_permission
from src.database import DatabaseSession, get_checkpoint_saver
from src.entities import OrganizationProvider, Permission, Provider, ProviderType, Thread
from src.helpers import agent_messages_to_list, chunk_to_text, get_config
from src.schemas import CreateThreadRequest, RunRequest, ThreadResponse, UpdateThreadRequest

router = APIRouter(prefix="/organizations/{organization_id}/threads", tags=["threads"])

CheckpointSaver = Annotated[AsyncPostgresSaver, Depends(get_checkpoint_saver)]


def get_provider_api_key(
    db: DatabaseSession,
    organization_id: uuid.UUID,
    provider_str: str,
) -> tuple[Provider, str]:
    """Busca a API key do provedor LLM configurado na organizacao."""
    try:
        provider = Provider(provider_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor invalido: {provider_str}",
        )

    # Apenas OpenAI e OpenRouter suportados
    if provider not in [Provider.OPENAI, Provider.OPENROUTER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao suportado. Use OPENAI ou OPENROUTER.",
        )

    # Busca a configuracao do provedor LLM
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == ProviderType.LLM,
        OrganizationProvider.provider == provider,
        OrganizationProvider.is_active == True,
    )
    org_provider = db.exec(statement).first()

    if not org_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao configurado para esta organizacao",
        )

    return provider, org_provider.api_key


@router.get("", response_model=List[ThreadResponse])
def list_threads(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    membership: CurrentMembership,
    db: DatabaseSession,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 50,
):
    """Lista threads do usuario na organizacao (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_READ necessaria",
        )

    # Busca threads do usuario ordenadas por ultima mensagem (nulls last) ou data de criacao
    statement = (
        select(Thread)
        .where(
            Thread.organization_id == organization_id,
            Thread.created_by_id == membership.id,
        )
        .order_by(
            col(Thread.last_message_at).desc().nulls_last(),
            col(Thread.created_at).desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    threads = db.exec(statement).all()

    return [
        ThreadResponse(
            id=t.id,
            title=t.title,
            last_message_at=t.last_message_at,
            last_message_preview=t.last_message_preview,
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
    membership: CurrentMembership,
    db: DatabaseSession,
):
    """Cria uma nova thread (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
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
        last_message_at=thread.last_message_at,
        last_message_preview=thread.last_message_preview,
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
        last_message_at=thread.last_message_at,
        last_message_preview=thread.last_message_preview,
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
        last_message_at=thread.last_message_at,
        last_message_preview=thread.last_message_preview,
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
    organization_id: uuid.UUID,
    thread_id: str,
    current_user: CurrentUser,
    db: DatabaseSession,
    checkpointer: CheckpointSaver,
):
    """Retorna mensagens de uma thread (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_READ necessaria",
        )

    # Busca o checkpoint diretamente sem precisar criar um agente
    config = get_config(thread_id)
    checkpoint_tuple = await checkpointer.aget_tuple(config)

    if not checkpoint_tuple or not checkpoint_tuple.checkpoint:
        return {"messages": []}

    state_messages = checkpoint_tuple.checkpoint.get("channel_values", {}).get("messages", [])
    return {"messages": agent_messages_to_list(state_messages)}


@router.post("/{thread_id}/runs/invoke")
async def invoke_run(
    organization_id: uuid.UUID,
    thread_id: str,
    payload: RunRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
    checkpointer: CheckpointSaver,
):
    """Executa e retorna todas as mensagens (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Obtem api_key do provedor
    provider, api_key = get_provider_api_key(db, organization_id, payload.config.provider)

    agent = build_agent(
        provider=provider,
        api_key=api_key,
        config=payload.config,
        checkpointer=checkpointer,
    )
    messages = [m.to_agent() for m in payload.input.messages]
    state_values = await agent.ainvoke(
        {"messages": messages}, config=get_config(thread_id)
    )
    state_messages = state_values.get("messages", [])

    # Atualiza thread com info da ultima mensagem
    thread = db.get(Thread, uuid.UUID(thread_id))
    if thread:
        user_message = payload.input.messages[0].content if payload.input.messages else ""
        preview = user_message[:100] + ("..." if len(user_message) > 100 else "")
        thread.last_message_at = datetime.now(UTC)
        thread.last_message_preview = preview
        db.add(thread)
        db.commit()

    return {"messages": agent_messages_to_list(state_messages)}


@router.post("/{thread_id}/runs/stream")
async def stream_run(
    organization_id: uuid.UUID,
    thread_id: str,
    payload: RunRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
    checkpointer: CheckpointSaver,
):
    """Executa com streaming SSE (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Obtem api_key do provedor
    provider, api_key = get_provider_api_key(db, organization_id, payload.config.provider)

    agent = build_agent(
        provider=provider,
        api_key=api_key,
        config=payload.config,
        checkpointer=checkpointer,
    )
    thread_config = get_config(thread_id)
    messages = [m.to_agent() for m in payload.input.messages]

    def sse_response_payload(data: Dict[str, Any]) -> str:
        """Formato basico text/event-stream."""
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def event_iterator():
        """Traduz eventos do LangGraph em mensagens SSE (chunk/final/done)."""
        try:
            # Primeiro: faz streaming dos chunks para o frontend
            async for event in agent.astream_events(
                {"messages": messages},
                config=thread_config,
            ):
                event_name = event.get("event")
                if event_name == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    text = chunk_to_text(chunk) if chunk is not None else ""
                    if not text:
                        continue
                    # Cada pedaco do modelo vira um evento chunk no SSE
                    yield sse_response_payload({"event": "chunk", "text": text})

            # IMPORTANTE: O loop acima so termina quando astream_events() completar TOTALMENTE,
            # incluindo a persistencia no checkpointer. Nao damos break antecipado.

            # Agora sim, busca as mensagens ja salvas no checkpointer
            state_snapshot = await agent.aget_state(config=thread_config)
            state_messages = state_snapshot.values.get("messages", [])

            # Evento final entrega o historico completo ja salvo no Postgres/checkpointer
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
