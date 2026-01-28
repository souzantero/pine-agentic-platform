import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import CreateRoleRequest, RoleDetailResponse, UpdateRoleRequest
from .service import (
    create_role as create_role_service,
    delete_role as delete_role_service,
    list_roles as list_roles_service,
    update_role as update_role_service,
)

router = APIRouter(prefix="/organizations/{organization_id}/roles", tags=["roles"])


@router.get("", response_model=List[RoleDetailResponse])
def list_roles(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Lista todas as roles da organizacao (requer ROLES_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_READ necessaria",
        )
    return list_roles_service(organization_id, db)


@router.post("", response_model=RoleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    organization_id: uuid.UUID,
    payload: CreateRoleRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Cria uma nova role na organizacao (requer ROLES_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )
    return create_role_service(organization_id, payload.name, payload.description, payload.permissions, db)


@router.put("/{role_id}", response_model=RoleDetailResponse)
def update_role(
    organization_id: uuid.UUID,
    role_id: uuid.UUID,
    payload: UpdateRoleRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza uma role (requer ROLES_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )
    return update_role_service(organization_id, role_id, payload.name, payload.description, payload.permissions, db)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    organization_id: uuid.UUID,
    role_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Deleta uma role (requer ROLES_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )
    delete_role_service(organization_id, role_id, db)
