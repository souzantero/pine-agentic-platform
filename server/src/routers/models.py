import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlmodel import select

from src.auth import CurrentUser, get_user_membership
from src.database import DatabaseSession
from src.entities import ModelProvider, Organization, OrganizationModelProvider
from src.schemas import ModelInfo, ModelsResponse

router = APIRouter(prefix="/organizations/{organization_id}/models", tags=["models"])

# Definicao dos modelos disponiveis por provedor
MODELS_BY_PROVIDER: dict[ModelProvider, list[ModelInfo]] = {
    ModelProvider.OPENAI: [
        ModelInfo(id="gpt-4o", name="GPT-4o", description="Modelo mais avancado e rapido"),
        ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", description="Versao menor e mais economica"),
        ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", description="Modelo poderoso com contexto estendido"),
        ModelInfo(id="gpt-4", name="GPT-4", description="Modelo original GPT-4"),
        ModelInfo(id="gpt-3.5-turbo", name="GPT-3.5 Turbo", description="Rapido e economico"),
    ],
    ModelProvider.OPENROUTER: [
        ModelInfo(id="openai/gpt-4o", name="GPT-4o", description="OpenAI GPT-4o via OpenRouter"),
        ModelInfo(id="openai/gpt-4o-mini", name="GPT-4o Mini", description="OpenAI GPT-4o Mini via OpenRouter"),
        ModelInfo(id="anthropic/claude-3.5-sonnet", name="Claude 3.5 Sonnet", description="Anthropic Claude 3.5 Sonnet"),
        ModelInfo(id="anthropic/claude-3-opus", name="Claude 3 Opus", description="Anthropic Claude 3 Opus"),
        ModelInfo(id="google/gemini-pro-1.5", name="Gemini Pro 1.5", description="Google Gemini Pro 1.5"),
        ModelInfo(id="meta-llama/llama-3.1-405b-instruct", name="Llama 3.1 405B", description="Meta Llama 3.1 405B"),
        ModelInfo(id="meta-llama/llama-3.1-70b-instruct", name="Llama 3.1 70B", description="Meta Llama 3.1 70B"),
    ],
    ModelProvider.ANTHROPIC: [
        ModelInfo(id="claude-3-5-sonnet-latest", name="Claude 3.5 Sonnet", description="Modelo mais recente e balanceado"),
        ModelInfo(id="claude-3-5-haiku-latest", name="Claude 3.5 Haiku", description="Rapido e economico"),
        ModelInfo(id="claude-3-opus-latest", name="Claude 3 Opus", description="Modelo mais poderoso"),
    ],
    ModelProvider.GOOGLE: [
        ModelInfo(id="gemini-2.0-flash-exp", name="Gemini 2.0 Flash", description="Modelo experimental mais recente"),
        ModelInfo(id="gemini-1.5-pro", name="Gemini 1.5 Pro", description="Modelo avancado com contexto longo"),
        ModelInfo(id="gemini-1.5-flash", name="Gemini 1.5 Flash", description="Rapido e eficiente"),
    ],
}


@router.get("", response_model=ModelsResponse)
def get_available_models(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
    provider: str | None = Query(default=None, description="Provedor especifico para buscar modelos"),
):
    """Retorna modelos disponiveis baseado no provedor da organizacao."""
    # Verifica se usuario e membro
    membership = get_user_membership(db, current_user.id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao e membro desta organizacao",
        )

    # Busca organizacao com provedores
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    # Busca provedores ativos
    statement = (
        select(OrganizationModelProvider)
        .where(
            OrganizationModelProvider.organization_id == organization_id,
            OrganizationModelProvider.is_active == True,
        )
        .order_by(OrganizationModelProvider.provider)
    )
    active_providers = db.exec(statement).all()
    configured_providers = [p.provider for p in active_providers]

    # Determina qual provedor usar
    active_provider: ModelProvider | None = None
    requested_provider: ModelProvider | None = None

    # Tenta usar o provedor solicitado
    if provider:
        try:
            requested_provider = ModelProvider(provider)
            if requested_provider in configured_providers:
                active_provider = requested_provider
        except ValueError:
            pass

    # Se nao especificou ou nao esta configurado, usa o padrao
    if not active_provider:
        if organization.default_model_provider and organization.default_model_provider in configured_providers:
            active_provider = organization.default_model_provider
        elif configured_providers:
            # Usa o primeiro configurado
            active_provider = configured_providers[0]

    # Busca modelos do provedor ativo
    models = MODELS_BY_PROVIDER.get(active_provider, []) if active_provider else []

    return ModelsResponse(
        default_provider=organization.default_model_provider.value if organization.default_model_provider else None,
        selected_provider=active_provider.value if active_provider else None,
        models=models,
        configured_providers=[p.value for p in configured_providers],
    )
