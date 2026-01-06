import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from src.auth import CurrentUser, check_permission, get_user_membership
from src.database import get_session
from src.entities import Permission, Thread
from src.schemas import CreateThreadRequest, ThreadResponse, UpdateThreadRequest

router = APIRouter(prefix="/organizations/{organization_id}/threads", tags=["threads"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=List[ThreadResponse])
def list_threads(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 50,
):
    """Lista threads da organizacao (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.THREADS_READ):
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
    threads = session.exec(statement).all()

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
    session: SessionDep,
):
    """Cria uma nova thread (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Busca o membership do usuario
    membership = get_user_membership(session, current_user.id, organization_id)
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
    session.add(thread)
    session.commit()
    session.refresh(thread)

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
    session: SessionDep,
):
    """Retorna detalhes de uma thread (requer THREADS_READ)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.THREADS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_READ necessaria",
        )

    # Busca a thread
    thread = session.get(Thread, thread_id)
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
    session: SessionDep,
):
    """Atualiza uma thread (requer THREADS_WRITE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.THREADS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_WRITE necessaria",
        )

    # Busca a thread
    thread = session.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )

    # Atualiza campos
    if payload.title is not None:
        thread.title = payload.title

    session.add(thread)
    session.commit()
    session.refresh(thread)

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
    session: SessionDep,
):
    """Deleta uma thread (requer THREADS_DELETE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.THREADS_DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao THREADS_DELETE necessaria",
        )

    # Busca a thread
    thread = session.get(Thread, thread_id)
    if not thread or thread.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread nao encontrada",
        )

    session.delete(thread)
    session.commit()
