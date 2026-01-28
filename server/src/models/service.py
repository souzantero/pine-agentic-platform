import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import Organization, OrganizationProvider, Provider, ProviderType

from .schemas import ModelInfo, ModelsResponse

# Definicao dos modelos disponiveis por provedor (apenas provedores LLM)
MODELS_BY_PROVIDER: dict[Provider, list[ModelInfo]] = {
    Provider.OPENAI: [
        ModelInfo(id="gpt-5.2", name="GPT-5.2", description="Modelo mais recente e avancado da OpenAI"),
        ModelInfo(id="gpt-5.1", name="GPT-5.1", description="Modelo de raciocinio avancado"),
        ModelInfo(id="gpt-5", name="GPT-5", description="Modelo GPT-5 base"),
        ModelInfo(id="gpt-5-mini", name="GPT-5 Mini", description="Versao compacta do GPT-5"),
        ModelInfo(id="gpt-4o", name="GPT-4o", description="Modelo rapido e versatil"),
        ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", description="Versao compacta e economica"),
        ModelInfo(id="gpt-4.1", name="GPT-4.1", description="Contexto de 1M tokens, otimizado para codigo"),
        ModelInfo(id="gpt-4.1-mini", name="GPT-4.1 Mini", description="Versao menor do GPT-4.1"),
        ModelInfo(id="o3", name="o3", description="Modelo de raciocinio avancado para tarefas complexas"),
        ModelInfo(id="o3-mini", name="o3 Mini", description="Raciocinio avancado, mais rapido"),
        ModelInfo(id="o4-mini", name="o4 Mini", description="Raciocinio rapido e economico"),
    ],
    Provider.OPENROUTER: [
        ModelInfo(id="openai/gpt-5.2", name="GPT-5.2", description="OpenAI GPT-5.2"),
        ModelInfo(id="openai/gpt-5.1", name="GPT-5.1", description="OpenAI GPT-5.1"),
        ModelInfo(id="openai/gpt-5", name="GPT-5", description="OpenAI GPT-5"),
        ModelInfo(id="openai/gpt-5-mini", name="GPT-5 Mini", description="OpenAI GPT-5 Mini"),
        ModelInfo(id="openai/gpt-4o", name="GPT-4o", description="OpenAI GPT-4o"),
        ModelInfo(id="openai/o3-mini", name="o3 Mini", description="OpenAI o3 Mini"),
        ModelInfo(id="anthropic/claude-opus-4.5", name="Claude Opus 4.5", description="Anthropic Claude Opus 4.5"),
        ModelInfo(id="anthropic/claude-sonnet-4.5", name="Claude Sonnet 4.5", description="Anthropic Claude Sonnet 4.5"),
        ModelInfo(id="anthropic/claude-haiku-4.5", name="Claude Haiku 4.5", description="Anthropic Claude Haiku 4.5"),
        ModelInfo(id="google/gemini-2.5-pro", name="Gemini 2.5 Pro", description="Google Gemini 2.5 Pro"),
        ModelInfo(id="google/gemini-2.5-flash", name="Gemini 2.5 Flash", description="Google Gemini 2.5 Flash"),
        ModelInfo(id="deepseek/deepseek-chat-v3", name="DeepSeek V3", description="DeepSeek V3, modelo open-source poderoso"),
        ModelInfo(id="meta-llama/llama-4-maverick", name="Llama 4 Maverick", description="Meta Llama 4 Maverick 400B MoE"),
        ModelInfo(id="qwen/qwen3-235b", name="Qwen3 235B", description="Alibaba Qwen3 235B"),
    ],
    Provider.ANTHROPIC: [
        ModelInfo(id="claude-opus-4-5-20251101", name="Claude Opus 4.5", description="Modelo mais inteligente da Anthropic"),
        ModelInfo(id="claude-sonnet-4-5-20250929", name="Claude Sonnet 4.5", description="Melhor custo-beneficio para codigo e agentes"),
        ModelInfo(id="claude-haiku-4-5-20251015", name="Claude Haiku 4.5", description="Rapido e economico"),
    ],
    Provider.GOOGLE: [
        ModelInfo(id="gemini-2.5-pro", name="Gemini 2.5 Pro", description="Modelo mais avancado com raciocinio"),
        ModelInfo(id="gemini-2.5-flash", name="Gemini 2.5 Flash", description="Rapido e eficiente"),
        ModelInfo(id="gemini-2.5-flash-lite", name="Gemini 2.5 Flash Lite", description="Ultra-rapido e economico"),
        ModelInfo(id="gemini-2.0-flash", name="Gemini 2.0 Flash", description="Geracao anterior, estavel"),
    ],
}


def get_available_models(
    organization_id: uuid.UUID, db: Session, provider_filter: str | None = None
) -> ModelsResponse:
    """Retorna modelos disponiveis baseado no provedor da organizacao."""
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    statement = (
        select(OrganizationProvider)
        .where(
            OrganizationProvider.organization_id == organization_id,
            OrganizationProvider.type == ProviderType.LLM,
            OrganizationProvider.is_active == True,
        )
        .order_by(OrganizationProvider.provider)
    )
    active_providers = db.exec(statement).all()
    configured_providers = [p.provider for p in active_providers]

    active_provider: Provider | None = None

    if provider_filter:
        try:
            requested_provider = Provider(provider_filter)
            if requested_provider in configured_providers:
                active_provider = requested_provider
        except ValueError:
            pass

    if not active_provider and configured_providers:
        active_provider = configured_providers[0]

    models = MODELS_BY_PROVIDER.get(active_provider, []) if active_provider else []

    return ModelsResponse(
        models=models,
        configured_providers=[p.value for p in configured_providers],
    )
