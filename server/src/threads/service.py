import uuid
from datetime import UTC, datetime
from typing import List

from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from src.agents.agent import AgentContext, build_agent
from src.database import get_checkpointer
from src.database.entities import Organization, OrganizationProvider, Provider, ProviderType, Thread
from .helpers import agent_messages_to_list, get_config

from .schemas import ThreadMessagesResponse, ThreadResponse


def _to_response(thread: Thread) -> ThreadResponse:
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        last_message_at=thread.last_message_at,
        last_message_preview=thread.last_message_preview,
        created_by_id=thread.created_by_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


def _get_thread(db: Session, thread_id: uuid.UUID, organization_id: uuid.UUID) -> Thread:
    thread = db.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )
    return thread


def get_provider_api_key(
    db: Session,
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

    if provider not in [Provider.OPENAI, Provider.OPENROUTER]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao suportado. Use OPENAI ou OPENROUTER.",
        )

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

    return provider, org_provider.credentials.get("apiKey", "")


def list_threads(
    organization_id: uuid.UUID, membership_id: uuid.UUID, db: Session,
    offset: int = 0, limit: int = 50,
) -> List[ThreadResponse]:
    statement = (
        select(Thread)
        .where(
            Thread.organization_id == organization_id,
            Thread.created_by_id == membership_id,
        )
        .order_by(
            col(Thread.last_message_at).desc().nulls_last(),
            col(Thread.created_at).desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    threads = db.exec(statement).all()
    return [_to_response(t) for t in threads]


def create_thread(
    organization_id: uuid.UUID, membership_id: uuid.UUID,
    title: str | None, db: Session,
) -> ThreadResponse:
    thread = Thread(
        organization_id=organization_id,
        created_by_id=membership_id,
        title=title,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _to_response(thread)


def get_thread(
    organization_id: uuid.UUID, thread_id: uuid.UUID, db: Session,
) -> ThreadResponse:
    return _to_response(_get_thread(db, thread_id, organization_id))


def update_thread(
    organization_id: uuid.UUID, thread_id: uuid.UUID,
    title: str | None, db: Session,
) -> ThreadResponse:
    thread = _get_thread(db, thread_id, organization_id)

    if title is not None:
        thread.title = title

    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _to_response(thread)


def delete_thread(
    organization_id: uuid.UUID, thread_id: uuid.UUID, db: Session,
) -> None:
    thread = _get_thread(db, thread_id, organization_id)
    db.delete(thread)
    db.commit()


async def get_thread_messages(
    thread_id: str,
) -> ThreadMessagesResponse:
    checkpointer = get_checkpointer()
    config = get_config(thread_id)
    checkpoint_tuple = await checkpointer.aget_tuple(config)

    if not checkpoint_tuple or not checkpoint_tuple.checkpoint:
        return ThreadMessagesResponse(messages=[])

    state_messages = checkpoint_tuple.checkpoint.get("channel_values", {}).get("messages", [])
    return ThreadMessagesResponse(messages=agent_messages_to_list(state_messages))


def prepare_stream_run(
    organization_id: uuid.UUID, thread_id: str, payload,
    current_user, db: Session,
):
    """Prepara o agente e contexto para streaming. Retorna (agent, thread_config, messages, agent_context)."""
    provider, api_key = get_provider_api_key(db, organization_id, payload.config.provider)

    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    agent_context = AgentContext(
        organization_id=str(organization_id),
        organization_name=organization.name,
        user_id=str(current_user.id),
        user_name=current_user.name,
    )

    # Atualiza thread com info da ultima mensagem
    thread = db.get(Thread, uuid.UUID(thread_id))
    if thread:
        user_message = payload.input.messages[0].content if payload.input.messages else ""
        preview = user_message[:100] + ("..." if len(user_message) > 100 else "")
        thread.last_message_at = datetime.now(UTC)
        thread.last_message_preview = preview
        db.add(thread)
        db.commit()

    agent = build_agent(
        db=db,
        organization_id=organization_id,
        provider=provider,
        api_key=api_key,
        config=payload.config,
        checkpointer=get_checkpointer(),
    )
    thread_config = get_config(thread_id)
    messages = [m.to_agent() for m in payload.input.messages]

    return agent, thread_config, messages, agent_context
