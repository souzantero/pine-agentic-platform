import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth import CurrentUser, check_permission
from src.database import DatabaseSession
from src.entities import OrganizationProvider, Permission, Provider, ProviderType
from src.schemas import (
    CreateProviderRequest,
    ProviderResponse,
    ProvidersListResponse,
)

router = APIRouter(prefix="/organizations/{organization_id}/providers", tags=["providers"])


# Mapeamento de providers por tipo
PROVIDERS_BY_TYPE = {
    ProviderType.LLM: [Provider.OPENAI, Provider.OPENROUTER, Provider.ANTHROPIC, Provider.GOOGLE],
    ProviderType.WEB_SEARCH: [Provider.TAVILY],
}


def validate_provider_type(type_str: str) -> ProviderType:
    """Valida e converte string para ProviderType enum."""
    try:
        return ProviderType(type_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo invalido: {type_str}. Valores aceitos: {[t.value for t in ProviderType]}",
        )


def validate_provider(provider_str: str, provider_type: ProviderType) -> Provider:
    """Valida e converte string para Provider enum, verificando compatibilidade com o tipo."""
    try:
        provider = Provider(provider_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor invalido: {provider_str}. Valores aceitos: {[p.value for p in Provider]}",
        )

    # Verifica se o provider é compatível com o tipo
    valid_providers = PROVIDERS_BY_TYPE.get(provider_type, [])
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao e compativel com tipo {provider_type.value}. "
            f"Provedores validos para {provider_type.value}: {[p.value for p in valid_providers]}",
        )

    return provider


@router.get("", response_model=ProvidersListResponse)
def list_providers(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    type: str | None = None,
):
    """Lista provedores da organizacao (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Busca provedores
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id
    )

    # Filtra por tipo se especificado
    if type:
        provider_type = validate_provider_type(type)
        statement = statement.where(OrganizationProvider.type == provider_type)

    statement = statement.order_by(OrganizationProvider.type, OrganizationProvider.provider)
    providers = db.exec(statement).all()

    return ProvidersListResponse(
        providers=[
            ProviderResponse(
                id=p.id,
                type=p.type.value,
                provider=p.provider.value,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in providers
        ],
    )


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_provider(
    organization_id: uuid.UUID,
    payload: CreateProviderRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Adiciona ou atualiza um provedor (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Valida tipo e provedor
    provider_type = validate_provider_type(payload.type)
    provider_enum = validate_provider(payload.provider, provider_type)

    # Valida API key
    if not payload.api_key or not payload.api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key e obrigatoria",
        )

    # Busca provedor existente (upsert por organization_id + type + provider)
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == provider_type,
        OrganizationProvider.provider == provider_enum,
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
        provider = OrganizationProvider(
            organization_id=organization_id,
            type=provider_type,
            provider=provider_enum,
            api_key=payload.api_key.strip(),
            is_active=True,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)

    return ProviderResponse(
        id=provider.id,
        type=provider.type.value,
        provider=provider.provider.value,
        is_active=provider.is_active,
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    organization_id: uuid.UUID,
    provider_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Remove um provedor (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    # Busca o provedor
    provider = db.get(OrganizationProvider, provider_id)
    if not provider or provider.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provedor nao encontrado",
        )

    # Deleta o provedor
    db.delete(provider)
    db.commit()
