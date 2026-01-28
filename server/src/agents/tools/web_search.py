"""Ferramenta de busca na web usando Tavily API."""

import asyncio
import logging
import uuid

from typing import List, Literal
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


def get_web_search_config(
    db: Database,
    organization_id: uuid.UUID,
) -> OrganizationConfig | None:
    """Busca a configuracao de web search da organizacao."""
    statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == ConfigType.TOOL,
        OrganizationConfig.key == ConfigKey.WEB_SEARCH,
        OrganizationConfig.is_enabled == True,
    )
    return db.exec(statement).first()


async def tavily_search_async(
    tavily_api_key: str,
    search_queries: List[str],
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = True,
) -> List[dict]:
    """Executa multiplas buscas no Tavily de forma assincrona.

    Args:
        tavily_api_key: API key do Tavily
        search_queries: Lista de queries de busca
        max_results: Numero maximo de resultados por query
        topic: Categoria do topico para filtrar resultados
        include_raw_content: Se deve incluir conteudo completo da pagina

    Returns:
        Lista de dicionarios com resultados da busca
    """
    tavily_client = AsyncTavilyClient(api_key=tavily_api_key)

    search_tasks = [
        tavily_client.search(
            query,
            max_results=max_results,
            include_raw_content=include_raw_content,
            topic=topic,
        )
        for query in search_queries
    ]

    search_results = await asyncio.gather(*search_tasks)
    return search_results


def create_web_search_tool(db: Database, organization_id: uuid.UUID):
    """Cria a ferramenta de busca na web para uma organizacao especifica.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        Ferramenta de busca configurada ou None se nao houver configuracao
    """
    # Busca configuracao de web search
    web_search_config = get_web_search_config(db, organization_id)
    if not web_search_config:
        logging.warning(f"Web search nao configurado para organizacao {organization_id}")
        return None

    config = web_search_config.config

    # Busca provider de busca (ex: TAVILY)
    search_provider_str = config.get("provider")
    if not search_provider_str:
        logging.warning("Provider de busca nao configurado")
        return None

    try:
        search_provider = Provider(search_provider_str)
    except ValueError:
        logging.warning(f"Provider de busca invalido: {search_provider_str}")
        return None

    # Busca API key do provider de busca
    search_api_key = get_provider_api_key(
        db, organization_id, ProviderType.WEB_SEARCH, search_provider
    )
    if not search_api_key:
        logging.warning(f"API key nao encontrada para provider {search_provider_str}")
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
    async def web_search(
        queries: List[str],
        tool_call_id: Annotated[str, InjectedToolCallId],
        max_results: int = 5,
        topic: Literal["general", "news", "finance"] = "general",
    ) -> Command:
        """Busca informacoes na web usando Tavily.

        Use esta ferramenta quando precisar buscar informacoes atualizadas na internet.
        Voce pode passar multiplas queries para buscar diferentes aspectos de um topico.

        Args:
            queries: Lista de queries de busca (ex: ["python async programming", "asyncio tutorial"])
            max_results: Numero maximo de resultados por query (padrao: 5)
            topic: Categoria da busca - "general", "news" ou "finance" (padrao: "general")

        Returns:
            Resultados formatados com sumarios e fontes
        """
        # Executa as buscas
        search_results = await tavily_search_async(
            tavily_api_key=search_api_key,
            search_queries=queries,
            max_results=max_results,
            topic=topic,
            include_raw_content=summarization_api_key is not None,
        )

        # Deduplica resultados por URL
        unique_results = {}
        for response in search_results:
            for result in response.get("results", []):
                url = result.get("url")
                if url and url not in unique_results:
                    unique_results[url] = {**result, "query": response.get("query", "")}

        # Configura modelo de sumarizacao se disponivel
        summarization_model = None
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
            except Exception as e:
                logging.warning(f"Falha ao inicializar modelo de sumarizacao: {e}")

        # Cria tarefas de sumarizacao
        async def noop():
            return None

        if summarization_model:
            summarization_tasks = [
                (
                    noop()
                    if not result.get("raw_content")
                    else summarize_webpage(
                        summarization_model, result["raw_content"][:max_content_length]
                    )
                )
                for result in unique_results.values()
            ]
            summaries = await asyncio.gather(*summarization_tasks)
        else:
            summaries = [None] * len(unique_results)

        # Combina resultados com sumarios
        summarized_results = {
            url: {
                "title": result.get("title", ""),
                "content": (
                    result.get("content", "") if summary is None else summary
                ),
            }
            for url, result, summary in zip(
                unique_results.keys(), unique_results.values(), summaries
            )
        }

        # Formata saida
        if not summarized_results:
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            "Nenhum resultado encontrado. Tente queries diferentes.",
                            tool_call_id=tool_call_id,
                        )
                    ]
                }
            )

        formatted_output = "Resultados da busca:\n\n"
        for i, (url, result) in enumerate(summarized_results.items()):
            formatted_output += f"\n--- FONTE {i + 1}: {result['title']} ---\n"
            formatted_output += f"URL: {url}\n\n"
            formatted_output += f"CONTEUDO:\n{result['content']}\n"
            formatted_output += "\n" + "-" * 80 + "\n"

        return Command(
            update={
                "messages": [
                    ToolMessage(formatted_output, tool_call_id=tool_call_id)
                ]
            }
        )

    return web_search
