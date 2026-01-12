import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth import CurrentUser, check_permission
from src.database import DatabaseSession
from src.entities import ModelProvider, Organization, OrganizationModelProvider, Permission
from src.schemas import (
    CreateModelProviderRequest,
    ModelProviderResponse,
    ModelProvidersListResponse,
    SetDefaultProviderRequest,
)

router = APIRouter(prefix="/organizations/{organization_id}/model-providers", tags=["model-providers"])


def validate_provider(provider_str: str) -> ModelProvider:
    """Valida e converte string para ModelProvider enum."""
    try:
        return ModelProvider(provider_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor invalido: {provider_str}. Valores aceitos: {[p.value for p in ModelProvider]}",
        )


@router.get("", response_model=ModelProvidersListResponse)
def list_model_providers(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Lista provedores de modelos da organizacao (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Busca organizacao
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    # Busca provedores
    statement = (
        select(OrganizationModelProvider)
        .where(OrganizationModelProvider.organization_id == organization_id)
        .order_by(OrganizationModelProvider.provider)
    )
    providers = db.exec(statement).all()

    return ModelProvidersListResponse(
        default_provider=organization.default_model_provider.value if organization.default_model_provider else None,
        providers=[
            ModelProviderResponse(
                id=p.id,
                provider=p.provider.value,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in providers
        ],
    )


@router.post("", response_model=ModelProviderResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_model_provider(
    organization_id: uuid.UUID,
    payload: CreateModelProviderRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Adiciona ou atualiza um provedor de modelos (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Valida provedor
    provider_enum = validate_provider(payload.provider)

    # Valida API key
    if not payload.api_key or not payload.api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key e obrigatoria",
        )

    # Busca provedor existente (upsert)
    statement = select(OrganizationModelProvider).where(
        OrganizationModelProvider.organization_id == organization_id,
        OrganizationModelProvider.provider == provider_enum,
    )
    existing = db.exec(statement).first()

    if existing:
        # Atualiza
        existing.api_key = payload.api_key.strip()
        existing.is_active = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        provider = existing
    else:
        # Cria novo
        provider = OrganizationModelProvider(
            organization_id=organization_id,
            provider=provider_enum,
            api_key=payload.api_key.strip(),
            is_active=True,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)

    return ModelProviderResponse(
        id=provider.id,
        provider=provider.provider.value,
        is_active=provider.is_active,
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.put("/default", response_model=dict)
def set_default_provider(
    organization_id: uuid.UUID,
    payload: SetDefaultProviderRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Define o provedor padrao da organizacao (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Busca organizacao
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    if payload.default_provider:
        # Valida provedor
        provider_enum = validate_provider(payload.default_provider)

        # Verifica se o provedor esta configurado
        statement = select(OrganizationModelProvider).where(
            OrganizationModelProvider.organization_id == organization_id,
            OrganizationModelProvider.provider == provider_enum,
        )
        existing = db.exec(statement).first()

        if not existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Configure a API Key do provedor antes de defini-lo como padrao",
            )

        organization.default_model_provider = provider_enum
    else:
        organization.default_model_provider = None

    db.add(organization)
    db.commit()

    return {"default_provider": payload.default_provider}


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model_provider(
    organization_id: uuid.UUID,
    provider_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Remove um provedor de modelos (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Busca o provedor
    provider = db.get(OrganizationModelProvider, provider_id)
    if not provider or provider.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provedor nao encontrado",
        )

    # Se este provedor for o padrao, remove como padrao
    organization = db.get(Organization, organization_id)
    if organization and organization.default_model_provider == provider.provider:
        organization.default_model_provider = None
        db.add(organization)

    # Deleta o provedor
    db.delete(provider)
    db.commit()
