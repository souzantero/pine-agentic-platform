import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import OrganizationProvider, Provider, ProviderType

from .schemas import ProviderResponse, ProvidersListResponse

# Mapeamento de providers por tipo
PROVIDERS_BY_TYPE = {
    ProviderType.LLM: [Provider.OPENAI, Provider.OPENROUTER, Provider.ANTHROPIC, Provider.GOOGLE],
    ProviderType.WEB_SEARCH: [Provider.TAVILY],
    ProviderType.STORAGE: [Provider.AWS_S3],
    ProviderType.EMBEDDING: [Provider.OPENAI],
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

    valid_providers = PROVIDERS_BY_TYPE.get(provider_type, [])
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao e compativel com tipo {provider_type.value}. "
            f"Provedores validos para {provider_type.value}: {[p.value for p in valid_providers]}",
        )

    return provider


def _to_response(p: OrganizationProvider) -> ProviderResponse:
    return ProviderResponse(
        id=p.id,
        type=p.type.value,
        provider=p.provider.value,
        is_active=p.is_active,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def list_providers(
    organization_id: uuid.UUID, db: Session, type_filter: str | None = None
) -> ProvidersListResponse:
    """Lista provedores da organizacao."""
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id
    )

    if type_filter:
        provider_type = validate_provider_type(type_filter)
        statement = statement.where(OrganizationProvider.type == provider_type)

    statement = statement.order_by(OrganizationProvider.type, OrganizationProvider.provider)
    providers = db.exec(statement).all()

    return ProvidersListResponse(providers=[_to_response(p) for p in providers])


def create_or_update_provider(
    organization_id: uuid.UUID, type_str: str, provider_str: str, credentials: dict, db: Session
) -> ProviderResponse:
    """Adiciona ou atualiza um provedor."""
    provider_type = validate_provider_type(type_str)
    provider_enum = validate_provider(provider_str, provider_type)

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciais sao obrigatorias",
        )

    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == provider_type,
        OrganizationProvider.provider == provider_enum,
    )
    existing = db.exec(statement).first()

    if existing:
        existing.credentials = {**existing.credentials, **credentials}
        existing.is_active = True
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return _to_response(existing)

    provider = OrganizationProvider(
        organization_id=organization_id,
        type=provider_type,
        provider=provider_enum,
        credentials=credentials,
        is_active=True,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)

    return _to_response(provider)


def delete_provider(organization_id: uuid.UUID, provider_id: uuid.UUID, db: Session) -> None:
    """Remove um provedor."""
    provider = db.get(OrganizationProvider, provider_id)
    if not provider or provider.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provedor nao encontrado",
        )

    db.delete(provider)
    db.commit()
