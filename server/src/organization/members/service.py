import uuid
from typing import List

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import OrganizationMember, Role
from src.roles.schemas import RoleResponse

from .schemas import MemberDetailResponse, MemberUserResponse


def list_members(organization_id: uuid.UUID, db: Session) -> List[MemberDetailResponse]:
    """Lista todos os membros da organizacao."""
    statement = select(OrganizationMember).where(
        OrganizationMember.organization_id == organization_id
    )
    members = db.exec(statement).all()

    result = []
    for member in members:
        db.refresh(member, ["user", "role"])
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


def remove_member(
    organization_id: uuid.UUID, member_id: uuid.UUID, current_user_id: uuid.UUID, db: Session
) -> None:
    """Remove um membro da organizacao."""
    member = db.get(OrganizationMember, member_id)
    if not member or member.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado",
        )

    if member.is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel remover o owner da organizacao",
        )

    if member.user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel remover a si mesmo",
        )

    db.delete(member)
    db.commit()


def update_member_role(
    organization_id: uuid.UUID, member_id: uuid.UUID, role_id: uuid.UUID, db: Session
) -> MemberDetailResponse:
    """Atualiza a role de um membro."""
    member = db.get(OrganizationMember, member_id)
    if not member or member.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membro nao encontrado",
        )

    role = db.get(Role, role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role nao encontrada nesta organizacao",
        )

    member.role_id = role_id
    db.add(member)
    db.commit()
    db.refresh(member, ["user", "role"])

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
