import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth import CurrentUser, check_permission
from src.database import DatabaseSession
from src.entities import OrganizationConfig, Permission, Provider, ProviderType, ConfigType, ConfigKey, OrganizationProvider
from src.schemas import (
    CreateOrgConfigRequest,
    UpdateOrgConfigRequest,
    OrgConfigResponse,
    OrgConfigsListResponse,
)

router = APIRouter(prefix="/organizations/{organization_id}/configs", tags=["configs"])


# Mapeamento de provedores por key de ferramenta
PROVIDERS_BY_TOOL_KEY = {
    ConfigKey.WEB_SEARCH: [Provider.TAVILY],
}

# Provedores LLM validos para sumarizacao
LLM_PROVIDERS = [Provider.OPENAI, Provider.OPENROUTER, Provider.ANTHROPIC, Provider.GOOGLE]


def validate_config_type(type_str: str) -> ConfigType:
    """Valida e converte string para ConfigType enum."""
    try:
        return ConfigType(type_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de configuracao invalido: {type_str}. Valores aceitos: {[t.value for t in ConfigType]}",
        )


def validate_config_key(key_str: str) -> ConfigKey:
    """Valida e converte string para ConfigKey enum."""
    try:
        return ConfigKey(key_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chave de configuracao invalida: {key_str}. Valores aceitos: {[k.value for k in ConfigKey]}",
        )


def validate_tool_provider(provider_str: str, key: ConfigKey) -> Provider:
    """Valida e converte string para Provider enum, verificando compatibilidade com a ferramenta."""
    try:
        provider = Provider(provider_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor invalido: {provider_str}",
        )

    valid_providers = PROVIDERS_BY_TOOL_KEY.get(key, [])
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao e compativel com ferramenta {key.value}. "
            f"Provedores validos: {[p.value for p in valid_providers]}",
        )

    return provider


def validate_llm_provider(provider_str: str | None) -> Provider | None:
    """Valida provedor LLM (para sumarizacao)."""
    if not provider_str:
        return None

    try:
        provider = Provider(provider_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor LLM invalido: {provider_str}",
        )

    if provider not in LLM_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider_str} nao e um provedor LLM valido. "
            f"Provedores validos: {[p.value for p in LLM_PROVIDERS]}",
        )

    return provider


def check_provider_configured(db: DatabaseSession, organization_id: uuid.UUID, provider: Provider, provider_type: ProviderType) -> None:
    """Verifica se o provedor esta configurado na organizacao."""
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == provider_type,
        OrganizationProvider.provider == provider,
        OrganizationProvider.is_active == True,
    )
    if not db.exec(statement).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provedor {provider.value} nao esta configurado para esta organizacao. Configure em Provedores primeiro.",
        )


def validate_tool_config(db: DatabaseSession, organization_id: uuid.UUID, key: ConfigKey, config: dict) -> None:
    """Valida configuracao de ferramenta."""
    # Valida provider da ferramenta
    provider_str = config.get("provider")
    if provider_str:
        provider = validate_tool_provider(provider_str, key)
        check_provider_configured(db, organization_id, provider, ProviderType.WEB_SEARCH)

    # Valida provider de sumarizacao
    summarization_provider_str = config.get("summarizationProvider")
    if summarization_provider_str:
        summarization_provider = validate_llm_provider(summarization_provider_str)
        if summarization_provider:
            check_provider_configured(db, organization_id, summarization_provider, ProviderType.LLM)


def validate_config(db: DatabaseSession, organization_id: uuid.UUID, config_type: ConfigType, key: ConfigKey, config: dict) -> None:
    """Valida configuracao baseado no tipo."""
    if config_type == ConfigType.TOOL:
        validate_tool_config(db, organization_id, key, config)


def to_response(config: OrganizationConfig) -> OrgConfigResponse:
    """Converte entidade para response."""
    return OrgConfigResponse(
        id=config.id,
        type=config.type.value,
        key=config.key.value,
        is_enabled=config.is_enabled,
        config=config.config or {},
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.get("", response_model=OrgConfigsListResponse)
def list_configs(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    type: str | None = None,
):
    """Lista configuracoes da organizacao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    statement = select(OrganizationConfig).where(OrganizationConfig.organization_id == organization_id)

    # Filtra por tipo se especificado
    if type:
        config_type = validate_config_type(type)
        statement = statement.where(OrganizationConfig.type == config_type)

    statement = statement.order_by(OrganizationConfig.type, OrganizationConfig.key)
    configs = db.exec(statement).all()

    return OrgConfigsListResponse(configs=[to_response(c) for c in configs])


@router.get("/{type}/{key}", response_model=OrgConfigResponse)
def get_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Retorna configuracao especifica (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    config_type = validate_config_type(type)
    config_key = validate_config_key(key)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type}/{key} nao encontrada",
        )

    return to_response(config)


@router.post("", response_model=OrgConfigResponse, status_code=status.HTTP_201_CREATED)
def create_config(
    organization_id: uuid.UUID,
    payload: CreateOrgConfigRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Cria configuracao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    config_type = validate_config_type(payload.type)
    config_key = validate_config_key(payload.key)

    # Valida configuracao especifica
    validate_config(db, organization_id, config_type, config_key, payload.config)

    # Verifica se ja existe
    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    if db.exec(statement).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ja existe configuracao {config_type.value}/{config_key.value}. Use PUT para atualizar.",
        )

    config = OrganizationConfig(
        organization_id=organization_id,
        type=config_type,
        key=config_key,
        is_enabled=payload.is_enabled,
        config=payload.config,
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    return to_response(config)


@router.put("/{type}/{key}", response_model=OrgConfigResponse)
def update_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    payload: UpdateOrgConfigRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Atualiza configuracao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    config_type = validate_config_type(type)
    config_key = validate_config_key(key)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type}/{key} nao encontrada",
        )

    # Valida nova configuracao se fornecida
    if payload.config is not None:
        validate_config(db, organization_id, config_type, config_key, payload.config)
        config.config = payload.config

    if payload.is_enabled is not None:
        config.is_enabled = payload.is_enabled

    db.add(config)
    db.commit()
    db.refresh(config)

    return to_response(config)


@router.delete("/{type}/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_config(
    organization_id: uuid.UUID,
    type: str,
    key: str,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Remove configuracao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    config_type = validate_config_type(type)
    config_key = validate_config_key(key)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type}/{key} nao encontrada",
        )

    db.delete(config)
    db.commit()
