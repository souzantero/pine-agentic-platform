import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import ConfigKey, ConfigType, OrganizationConfig, OrganizationProvider, Provider, ProviderType

from .schemas import OrgConfigResponse, OrgConfigsListResponse

# Mapeamento de provedores por key de ferramenta
PROVIDERS_BY_TOOL_KEY = {
    ConfigKey.WEB_SEARCH: [Provider.TAVILY],
    ConfigKey.WEB_FETCH: [Provider.TAVILY],
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


def check_provider_configured(
    db: Session, organization_id: uuid.UUID, provider: Provider, provider_type: ProviderType
) -> None:
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


def validate_tool_config(db: Session, organization_id: uuid.UUID, key: ConfigKey, config: dict) -> None:
    """Valida configuracao de ferramenta."""
    provider_str = config.get("provider")
    if provider_str:
        provider = validate_tool_provider(provider_str, key)
        check_provider_configured(db, organization_id, provider, ProviderType.WEB_SEARCH)

    summarization_provider_str = config.get("summarizationProvider")
    if summarization_provider_str:
        summarization_provider = validate_llm_provider(summarization_provider_str)
        if summarization_provider:
            check_provider_configured(db, organization_id, summarization_provider, ProviderType.LLM)


def validate_config(
    db: Session, organization_id: uuid.UUID, config_type: ConfigType, key: ConfigKey, config: dict
) -> None:
    """Valida configuracao baseado no tipo."""
    if config_type == ConfigType.TOOL:
        validate_tool_config(db, organization_id, key, config)


def _to_response(config: OrganizationConfig) -> OrgConfigResponse:
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


def list_configs(
    organization_id: uuid.UUID, db: Session, type_filter: str | None = None
) -> OrgConfigsListResponse:
    """Lista configuracoes da organizacao."""
    statement = select(OrganizationConfig).where(OrganizationConfig.organization_id == organization_id)

    if type_filter:
        config_type = validate_config_type(type_filter)
        statement = statement.where(OrganizationConfig.type == config_type)

    statement = statement.order_by(OrganizationConfig.type, OrganizationConfig.key)
    configs = db.exec(statement).all()

    return OrgConfigsListResponse(configs=[_to_response(c) for c in configs])


def get_config(
    organization_id: uuid.UUID, type_str: str, key_str: str, db: Session
) -> OrgConfigResponse:
    """Retorna configuracao especifica."""
    config_type = validate_config_type(type_str)
    config_key = validate_config_key(key_str)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type_str}/{key_str} nao encontrada",
        )

    return _to_response(config)


def create_config(
    organization_id: uuid.UUID, type_str: str, key_str: str,
    is_enabled: bool, config_data: dict, db: Session
) -> OrgConfigResponse:
    """Cria configuracao."""
    config_type = validate_config_type(type_str)
    config_key = validate_config_key(key_str)

    validate_config(db, organization_id, config_type, config_key, config_data)

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
        is_enabled=is_enabled,
        config=config_data,
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    return _to_response(config)


def update_config(
    organization_id: uuid.UUID, type_str: str, key_str: str,
    is_enabled: bool | None, config_data: dict | None, db: Session
) -> OrgConfigResponse:
    """Atualiza configuracao."""
    config_type = validate_config_type(type_str)
    config_key = validate_config_key(key_str)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type_str}/{key_str} nao encontrada",
        )

    if config_data is not None:
        validate_config(db, organization_id, config_type, config_key, config_data)
        config.config = config_data

    if is_enabled is not None:
        config.is_enabled = is_enabled

    db.add(config)
    db.commit()
    db.refresh(config)

    return _to_response(config)


def delete_config(organization_id: uuid.UUID, type_str: str, key_str: str, db: Session) -> None:
    """Remove configuracao."""
    config_type = validate_config_type(type_str)
    config_key = validate_config_key(key_str)

    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == config_type,
        OrganizationConfig.key == config_key,
    )
    config = db.exec(statement).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuracao {type_str}/{key_str} nao encontrada",
        )

    db.delete(config)
    db.commit()
