"""Ferramenta de fetch de conteudo web usando Tavily API."""

import logging
import uuid

from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from typing_extensions import Annotated
from langgraph.types import Command
from sqlmodel import select
from tavily import AsyncTavilyClient

from src.database.entities import (
    OrganizationConfig,
    ConfigType,
    ConfigKey,
    ProviderType,
    Provider,
)
from src.database import Database
from src.agents.tools.common import (
    Summary,
    get_provider_api_key,
    get_model,
    summarize_webpage,
)


def get_web_fetch_config(
    db: Database,
    organization_id: uuid.UUID,
) -> OrganizationConfig | None:
    """Busca a configuracao de web fetch da organizacao."""
    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == ConfigType.TOOL,
        OrganizationConfig.key == ConfigKey.WEB_FETCH,
        OrganizationConfig.is_enabled == True,
    )
    return db.exec(statement).first()


async def tavily_extract_async(
    tavily_api_key: str,
    urls: list[str],
) -> dict:
    """Extrai conteudo de URLs usando Tavily.

    Args:
        tavily_api_key: API key do Tavily
        urls: Lista de URLs para extrair conteudo

    Returns:
        Dicionario com resultados da extracao
    """
    tavily_client = AsyncTavilyClient(api_key=tavily_api_key)
    return await tavily_client.extract(urls)


def create_web_fetch_tool(db: Database, organization_id: uuid.UUID):
    """Cria a ferramenta de fetch de conteudo web para uma organizacao especifica.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        Ferramenta de fetch configurada ou None se nao houver configuracao
    """
    # Busca configuracao de web fetch
    web_fetch_config = get_web_fetch_config(db, organization_id)
    if not web_fetch_config:
        logging.warning(f"Web fetch nao configurado para organizacao {organization_id}")
        return None

    config = web_fetch_config.config

    # Busca provider (ex: TAVILY)
    fetch_provider_str = config.get("provider")
    if not fetch_provider_str:
        logging.warning("Provider de fetch nao configurado")
        return None

    try:
        fetch_provider = Provider(fetch_provider_str)
    except ValueError:
        logging.warning(f"Provider de fetch invalido: {fetch_provider_str}")
        return None

    # Busca API key do provider (reutiliza WEB_SEARCH pois Tavily serve ambos)
    fetch_api_key = get_provider_api_key(
        db, organization_id, ProviderType.WEB_SEARCH, fetch_provider
    )
    if not fetch_api_key:
        logging.warning(f"API key nao encontrada para provider {fetch_provider_str}")
        return None

    # Configuracoes de sumarizacao (opcional)
    summarization_provider_str = config.get("summarizationProvider")
    summarization_model_name = config.get("summarizationModel")
    summarization_max_tokens = config.get("summarizationMaxTokens", 8192)
    max_content_length = config.get("maxContentLength", 50000)
    max_output_retries = config.get("maxOutputRetries", 3)

    # Busca API key do provider de sumarizacao se configurado
    summarization_api_key = None
    summarization_provider = None
    if summarization_provider_str and summarization_model_name:
        try:
            summarization_provider = Provider(summarization_provider_str)
            summarization_api_key = get_provider_api_key(
                db, organization_id, ProviderType.LLM, summarization_provider
            )
        except ValueError:
            logging.warning(
                f"Provider de sumarizacao invalido: {summarization_provider_str}"
            )

    @tool
    async def web_fetch(
        url: str,
        tool_call_id: Annotated[str, InjectedToolCallId],
    ) -> Command:
        """Busca e extrai o conteudo de uma URL especifica.

        Use esta ferramenta quando o usuario compartilhar um link e quiser que voce
        leia ou analise o conteudo dessa pagina. Funciona com artigos, documentacao,
        noticias, blogs e outras paginas web.

        Args:
            url: URL da pagina para extrair conteudo (ex: "https://exemplo.com/artigo")

        Returns:
            Conteudo extraido da pagina, opcionalmente sumarizado
        """
        # Extrai conteudo da URL
        try:
            extract_result = await tavily_extract_async(
                tavily_api_key=fetch_api_key,
                urls=[url],
            )
        except Exception as e:
            logging.error(f"Erro ao extrair conteudo da URL {url}: {e}")
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            f"Erro ao acessar a URL: {str(e)}",
                            tool_call_id=tool_call_id,
                        )
                    ]
                }
            )

        # Verifica se houve resultado
        results = extract_result.get("results", [])
        failed_urls = extract_result.get("failed_results", [])

        if not results:
            error_msg = "Nao foi possivel extrair o conteudo desta URL."
            if failed_urls:
                failed_url_list = [f.get("url", str(f)) if isinstance(f, dict) else str(f) for f in failed_urls]
                error_msg += f" URLs que falharam: {', '.join(failed_url_list)}"
            return Command(
                update={
                    "messages": [
                        ToolMessage(error_msg, tool_call_id=tool_call_id)
                    ]
                }
            )

        # Pega o primeiro resultado (so passamos uma URL)
        result = results[0]
        raw_content = result.get("raw_content", "")

        if not raw_content:
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            "A pagina foi acessada mas nao retornou conteudo extraivel.",
                            tool_call_id=tool_call_id,
                        )
                    ]
                }
            )

        # Trunca conteudo se muito grande
        content = raw_content[:max_content_length]

        # Sumariza se modelo configurado
        if summarization_api_key and summarization_model_name and summarization_provider:
            try:
                base_model = get_model(
                    provider=summarization_provider,
                    api_key=summarization_api_key,
                    model=summarization_model_name,
                    temperature=0.3,
                    max_tokens=summarization_max_tokens,
                )
                summarization_model = (
                    base_model
                    .with_structured_output(Summary)
                    .with_retry(stop_after_attempt=max_output_retries)
                )
                content = await summarize_webpage(summarization_model, content)
            except Exception as e:
                logging.warning(f"Falha ao sumarizar conteudo: {e}")
                # Continua com conteudo original

        # Formata saida
        formatted_output = f"Conteudo extraido de: {url}\n\n"
        formatted_output += "-" * 80 + "\n\n"
        formatted_output += content
        formatted_output += "\n\n" + "-" * 80

        return Command(
            update={
                "messages": [
                    ToolMessage(formatted_output, tool_call_id=tool_call_id)
                ]
            }
        )

    return web_fetch
