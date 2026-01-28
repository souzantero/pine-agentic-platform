"""Funcoes compartilhadas do agente."""

from langchain_openai import ChatOpenAI

from src.database.entities import Provider
from src.core.env import openrouter_base_url


# Mapeamento de nomes de ferramentas para nomes de exibicao
TOOL_DISPLAY_NAMES = {
    "web_search": "Pesquisando na web",
    "web_fetch": "Lendo página",
    "knowledge_search": "Buscando na base de conhecimento",
}


def get_tool_display_name(tool_name: str) -> str:
    """Retorna o nome de exibicao para uma ferramenta."""
    return TOOL_DISPLAY_NAMES.get(tool_name, tool_name)


def get_model(
    provider: Provider,
    api_key: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> ChatOpenAI:
    """Cria o modelo de LLM baseado no provedor.

    Args:
        provider: Provedor do modelo (OPENAI, OPENROUTER, etc)
        api_key: API key do provedor
        model: Nome/ID do modelo
        temperature: Temperatura para geracao (default: 0.7)
        max_tokens: Maximo de tokens de saida (opcional)

    Returns:
        Instancia do modelo configurado
    """
    kwargs = {
        "model": model,
        "temperature": temperature,
        "openai_api_key": api_key,
    }

    if max_tokens:
        kwargs["max_tokens"] = max_tokens

    if provider == Provider.OPENROUTER:
        kwargs["openai_api_base"] = openrouter_base_url

    return ChatOpenAI(**kwargs)
