import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.auth import CurrentUser, check_permission, get_user_membership
from src.database import get_session
from src.entities import OrganizationMember, Permission, Role
from src.schemas import (
    MemberDetailResponse,
    MemberUserResponse,
    RoleResponse,
    UpdateMemberRoleRequest,
)

router = APIRouter(prefix="/organizations/{organization_id}/members", tags=["members"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=List[MemberDetailResponse])
def list_members(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Lista todos os membros da organizacao (requer MEMBERS_READ)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.MEMBERS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_READ necessaria",
        )

    # Busca membros
    statement = select(OrganizationMember).where(
        OrganizationMember.organization_id == organization_id
    )
    members = session.exec(statement).all()

    # Monta response com relacionamentos
    result = []
    for member in members:
        session.refresh(member, ["user", "role"])
        result.append(
            MemberDetailResponse(
                id=member.id,
                user=MemberUserResponse(
                    id=member.user.id,
                    email=member.user.email,
                    name=member.user.name,
                ),
                role=RoleResponse(
                    id=member.role.id,
                    name=member.role.name,
                    description=member.role.description,
                ),
                is_owner=member.is_owner,
                created_at=member.created_at,
            )
        )

    return result


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    organization_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Remove um membro da organizacao (requer MEMBERS_MANAGE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.MEMBERS_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_MANAGE necessaria",
        )

    # Busca o membro
    member = session.get(OrganizationMember, member_id)
    if not member or member.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado",
        )

    # Nao permite remover owner
    if member.is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel remover o owner da organizacao",
        )

    # Nao permite remover a si mesmo
    if member.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel remover a si mesmo",
        )

    session.delete(member)
    session.commit()


@router.put("/{member_id}/role", response_model=MemberDetailResponse)
def update_member_role(
    organization_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: UpdateMemberRoleRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Atualiza a role de um membro (requer MEMBERS_MANAGE)."""
    # Verifica permissao
    if not check_permission(session, current_user.id, organization_id, Permission.MEMBERS_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_MANAGE necessaria",
        )

    # Busca o membro
    member = session.get(OrganizationMember, member_id)
    if not member or member.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado",
        )

    # Verifica se a role existe e pertence a organizacao
    role = session.get(Role, payload.role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role nao encontrada nesta organizacao",
        )

    # Atualiza a role
    member.role_id = payload.role_id
    session.add(member)
    session.commit()
    session.refresh(member, ["user", "role"])

    return MemberDetailResponse(
        id=member.id,
        user=MemberUserResponse(
            id=member.user.id,
            email=member.user.email,
            name=member.user.name,
        ),
        role=RoleResponse(
            id=member.role.id,
            name=member.role.name,
            description=member.role.description,
        ),
        is_owner=member.is_owner,
        created_at=member.created_at,
    )
