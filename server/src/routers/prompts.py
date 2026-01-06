import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, col, select

from src.auth import CurrentUser, check_permission, get_user_membership
from src.database import get_session
from src.entities import Permission, Prompt, PromptRole
from src.schemas import CreatePromptRequest, PromptResponse, UpdatePromptRequest

router = APIRouter(prefix="/organizations/{organization_id}/prompts", tags=["prompts"])

SessionDep = Annotated[Session, Depends(get_session)]


def validate_prompt_role(role_str: str) -> PromptRole:
    """Valida e converte string para PromptRole enum."""
    try:
        return PromptRole(role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role invalida: {role_str}. Valores aceitos: {[r.value for r in PromptRole]}",
        )


@router.get("", response_model=List[PromptResponse])
def list_prompts(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 50,
):
    """Lista prompts da organizacao (requer PROMPTS_READ)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.PROMPTS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao PROMPTS_READ necessaria",
        )

    # Busca prompts
    statement = (
        select(Prompt)
        .where(Prompt.organization_id == organization_id)
        .order_by(col(Prompt.created_at).desc())
        .offset(offset)
        .limit(limit)
    )
    prompts = session.exec(statement).all()

    return [
        PromptResponse(
            id=p.id,
            name=p.name,
            content=p.content,
            role=p.role.value,
            created_by_id=p.created_by_id,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in prompts
    ]


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    organization_id: uuid.UUID,
    payload: CreatePromptRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Cria um novo prompt (requer PROMPTS_WRITE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.PROMPTS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao PROMPTS_WRITE necessaria",
        )

    # Valida role
    prompt_role = validate_prompt_role(payload.role)

    # Busca o membership do usuario
    membership = get_user_membership(session, current_user.id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao e membro desta organizacao",
        )

    # Cria o prompt
    prompt = Prompt(
        organization_id=organization_id,
        created_by_id=membership.id,
        name=payload.name,
        content=payload.content,
        role=prompt_role,
    )
    session.add(prompt)
    session.commit()
    session.refresh(prompt)

    return PromptResponse(
        id=prompt.id,
        name=prompt.name,
        content=prompt.content,
        role=prompt.role.value,
        created_by_id=prompt.created_by_id,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(
    organization_id: uuid.UUID,
    prompt_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Retorna detalhes de um prompt (requer PROMPTS_READ)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.PROMPTS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao PROMPTS_READ necessaria",
        )

    # Busca o prompt
    prompt = session.get(Prompt, prompt_id)
    if not prompt or prompt.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt nao encontrado",
        )

    return PromptResponse(
        id=prompt.id,
        name=prompt.name,
        content=prompt.content,
        role=prompt.role.value,
        created_by_id=prompt.created_by_id,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    organization_id: uuid.UUID,
    prompt_id: uuid.UUID,
    payload: UpdatePromptRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Atualiza um prompt (requer PROMPTS_WRITE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.PROMPTS_WRITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao PROMPTS_WRITE necessaria",
        )

    # Busca o prompt
    prompt = session.get(Prompt, prompt_id)
    if not prompt or prompt.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt nao encontrado",
        )

    # Atualiza campos
    if payload.name is not None:
        prompt.name = payload.name

    if payload.content is not None:
        prompt.content = payload.content

    if payload.role is not None:
        prompt.role = validate_prompt_role(payload.role)

    session.add(prompt)
    session.commit()
    session.refresh(prompt)

    return PromptResponse(
        id=prompt.id,
        name=prompt.name,
        content=prompt.content,
        role=prompt.role.value,
        created_by_id=prompt.created_by_id,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
    )


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    organization_id: uuid.UUID,
    prompt_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Deleta um prompt (requer PROMPTS_DELETE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.PROMPTS_DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao PROMPTS_DELETE necessaria",
        )

    # Busca o prompt
    prompt = session.get(Prompt, prompt_id)
    if not prompt or prompt.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt nao encontrado",
        )

    session.delete(prompt)
    session.commit()
