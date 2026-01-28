import uuid

from fastapi import APIRouter, HTTPException, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import (
    CreateOrgConfigRequest,
    UpdateOrgConfigRequest,
    OrgConfigResponse,
    OrgConfigsListResponse,
)
from .service import (
    list_configs as list_configs_service,
    get_config as get_config_service,
    create_config as create_config_service,
    update_config as update_config_service,
    delete_config as delete_config_service,
)

router = APIRouter(prefix="/organizations/{organization_id}/configs", tags=["configs"])


def _check_org_manage(db, user_id, organization_id):
    if not check_permission(db, user_id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )


@router.get("", response_model=OrgConfigsListResponse)
def list_configs(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
    type: str | None = None,
):
    """Lista configuracoes da organizacao (requer ORGANIZATION_MANAGE)."""
    _check_org_manage(db, current_user.id, organization_id)
    return list_configs_service(organization_id, db, type)


@router.get("/{type}/{key}", response_model=OrgConfigResponse)
def get_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Retorna configuracao especifica (requer ORGANIZATION_MANAGE)."""
    _check_org_manage(db, current_user.id, organization_id)
    return get_config_service(organization_id, type, key, db)


@router.post("", response_model=OrgConfigResponse, status_code=status.HTTP_201_CREATED)
def create_config(
    organization_id: uuid.UUID,
    payload: CreateOrgConfigRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Cria configuracao (requer ORGANIZATION_MANAGE)."""
    _check_org_manage(db, current_user.id, organization_id)
    return create_config_service(organization_id, payload.type, payload.key, payload.is_enabled, payload.config, db)


@router.put("/{type}/{key}", response_model=OrgConfigResponse)
def update_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    payload: UpdateOrgConfigRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza configuracao (requer ORGANIZATION_MANAGE)."""
    _check_org_manage(db, current_user.id, organization_id)
    return update_config_service(organization_id, type, key, payload.is_enabled, payload.config, db)


@router.delete("/{type}/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Remove configuracao (requer ORGANIZATION_MANAGE)."""
    _check_org_manage(db, current_user.id, organization_id)
    delete_config_service(organization_id, type, key, db)
