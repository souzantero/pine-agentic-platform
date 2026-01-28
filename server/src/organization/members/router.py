import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import MemberDetailResponse, UpdateMemberRoleRequest
from .service import (
    list_members as list_members_service,
    remove_member as remove_member_service,
    update_member_role as update_member_role_service,
)

router = APIRouter(prefix="/organizations/{organization_id}/members", tags=["members"])


@router.get("", response_model=List[MemberDetailResponse])
def list_members(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Lista todos os membros da organizacao (requer MEMBERS_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_READ necessaria",
        )
    return list_members_service(organization_id, db)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    organization_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Remove um membro da organizacao (requer MEMBERS_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_MANAGE necessaria",
        )
    remove_member_service(organization_id, member_id, current_user.id, db)


@router.put("/{member_id}/role", response_model=MemberDetailResponse)
def update_member_role(
    organization_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: UpdateMemberRoleRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza a role de um membro (requer MEMBERS_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_MANAGE necessaria",
        )
    return update_member_role_service(organization_id, member_id, payload.role_id, db)
