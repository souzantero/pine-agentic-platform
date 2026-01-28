import uuid

from fastapi import APIRouter, HTTPException, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import CreateProviderRequest, ProviderResponse, ProvidersListResponse
from .service import (
    create_or_update_provider as create_or_update_provider_service,
    delete_provider as delete_provider_service,
    list_providers as list_providers_service,
)

router = APIRouter(prefix="/organizations/{organization_id}/providers", tags=["providers"])


@router.get("", response_model=ProvidersListResponse)
def list_providers(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
    type: str | None = None,
):
    """Lista provedores da organizacao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )
    return list_providers_service(organization_id, db, type)


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_provider(
    organization_id: uuid.UUID,
    payload: CreateProviderRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Adiciona ou atualiza um provedor (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )
    return create_or_update_provider_service(
        organization_id, payload.type, payload.provider, payload.credentials, db
    )


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    organization_id: uuid.UUID,
    provider_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Remove um provedor (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )
    delete_provider_service(organization_id, provider_id, db)
