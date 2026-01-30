"""Ferramenta de busca no conhecimento usando RAG."""

import logging
import uuid

from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from typing_extensions import Annotated
from langgraph.types import Command
from sqlmodel import select

from src.database.entities import (
    DocumentCollection,
    Document,
    DocumentStatus,
)
from src.database import Database
from .config import get_embedding_service
from .services import RetrievalService, SearchFilters

logger = logging.getLogger(__name__)


def create_knowledge_search_tool(db: Database, organization_id: uuid.UUID):
    """Cria a ferramenta de busca no conhecimento para uma organizacao especifica.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        Ferramenta de busca configurada ou None se nao houver configuracao
    """
    # Usa a factory para obter o servico de embeddings
    embedding_service = get_embedding_service(db, organization_id)
    if not embedding_service:
        logger.warning(f"Embeddings nao configurado para organizacao {organization_id}")
        return None

    # Verifica se existem documentos processados
    docs_statement = (
        select(Document)
        .join(DocumentCollection)
        .where(
            DocumentCollection.organization_id == organization_id,
            Document.status == DocumentStatus.COMPLETED,
        )
        .limit(1)
    )
    has_documents = db.exec(docs_statement).first() is not None

    if not has_documents:
        logger.info(f"Organizacao {organization_id} nao possui documentos processados")
        return None

    # Cria o servico de retrieval
    retrieval_service = RetrievalService(db)

    @tool
    async def knowledge_search(
        query: str,
        tool_call_id: Annotated[str, InjectedToolCallId],
        max_results: int = 5,
        similarity_threshold: float | None = None,
    ) -> Command:
        """Busca informacoes na base de conhecimento da organizacao.

        Use esta ferramenta quando precisar buscar informacoes em documentos
        que foram carregados na base de conhecimento. A busca e semantica,
        ou seja, encontra trechos relevantes mesmo que nao contenham as
        palavras exatas da pergunta.

        Args:
            query: Pergunta ou termos de busca (ex: "qual a politica de ferias?")
            max_results: Numero maximo de trechos a retornar (padrao: 5)
            similarity_threshold: Limite minimo de similaridade (0.0 a 1.0). Ex: 0.7 retorna apenas resultados com 70%+ de similaridade.

        Returns:
            Trechos relevantes dos documentos com suas fontes
        """
        try:
            # Gera embedding da query
            query_embedding = embedding_service.embed_single(query)

            # Configura filtros de busca (modo hibrido com vetor e texto)
            filters = SearchFilters(
                organization_id=organization_id,
                query_text=query,
                query_embedding=query_embedding,
                max_results=max_results,
                similarity_threshold=similarity_threshold,
            )

            # Executa a busca
            results = retrieval_service.search(filters)

            if not results:
                return Command(
                    update={
                        "messages": [
                            ToolMessage(
                                "Nenhum resultado encontrado na base de conhecimento. "
                                "Tente reformular a pergunta ou verifique se existem "
                                "documentos relevantes carregados.",
                                tool_call_id=tool_call_id,
                            )
                        ]
                    }
                )

            # Formata saida
            formatted_output = f"Encontrei {len(results)} trechos relevantes na base de conhecimento:\n\n"

            for i, result in enumerate(results, 1):
                score_pct = round(result.score * 100, 1)

                formatted_output += f"--- TRECHO {i} (Relevância: {score_pct}%) ---\n"
                formatted_output += f"Documento: {result.document_name}\n"
                formatted_output += f"Coleção: {result.collection_name}\n"
                formatted_output += f"Parte: {result.chunk_index + 1}\n\n"
                formatted_output += f"{result.content}\n"
                formatted_output += "\n" + "-" * 60 + "\n\n"

            return Command(
                update={
                    "messages": [
                        ToolMessage(formatted_output, tool_call_id=tool_call_id)
                    ]
                }
            )

        except Exception as e:
            logger.error(f"Erro na busca de conhecimento: {e}")
            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            f"Erro ao buscar na base de conhecimento: {str(e)}",
                            tool_call_id=tool_call_id,
                        )
                    ]
                }
            )

    return knowledge_search
