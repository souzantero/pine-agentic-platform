"""Ferramenta de busca no conhecimento usando RAG."""

import logging
import uuid

from langchain_core.tools import tool, InjectedToolCallId
from langchain_core.messages import ToolMessage
from typing_extensions import Annotated
from langgraph.types import Command
from sqlalchemy import text
from sqlmodel import select

from src.database.entities import (
    DocumentCollection,
    Document,
    DocumentStatus,
)
from src.database import Database
from src.core.embedding import get_embeddings_client

logger = logging.getLogger(__name__)


def create_knowledge_search_tool(db: Database, organization_id: uuid.UUID):
    """Cria a ferramenta de busca no conhecimento para uma organizacao especifica.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        Ferramenta de busca configurada ou None se nao houver configuracao
    """
    # Usa a factory para obter o cliente de embeddings
    embeddings = get_embeddings_client(db, organization_id)
    if not embeddings:
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

    @tool
    async def knowledge_search(
        query: str,
        tool_call_id: Annotated[str, InjectedToolCallId],
        max_results: int = 5,
    ) -> Command:
        """Busca informacoes na base de conhecimento da organizacao.

        Use esta ferramenta quando precisar buscar informacoes em documentos
        que foram carregados na base de conhecimento. A busca e semantica,
        ou seja, encontra trechos relevantes mesmo que nao contenham as
        palavras exatas da pergunta.

        Args:
            query: Pergunta ou termos de busca (ex: "qual a politica de ferias?")
            max_results: Numero maximo de trechos a retornar (padrao: 5)

        Returns:
            Trechos relevantes dos documentos com suas fontes
        """
        try:
            # Gera embedding da query
            query_embedding = embeddings.embed_query(query)

            # Busca chunks similares usando pgvector
            # Usa SQL raw para aproveitar o operador <=> (cosine distance)
            # Nota: usamos \: para escapar o :: do cast PostgreSQL
            sql = text("""
                SELECT
                    dc.content,
                    dc.chunk_index,
                    d.name as document_name,
                    col.name as collection_name,
                    1 - (dc.embedding <=> :query_embedding\:\:vector) as similarity
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                JOIN document_collections col ON d.collection_id = col.id
                WHERE col.organization_id = :org_id
                  AND d.status = 'COMPLETED'
                ORDER BY dc.embedding <=> :query_embedding\:\:vector
                LIMIT :max_results
            """)

            # Executa a query
            result = db.exec(sql, params={
                "query_embedding": query_embedding,
                "org_id": str(organization_id),
                "max_results": max_results,
            })

            chunks = result.fetchall()

            if not chunks:
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
            formatted_output = f"Encontrei {len(chunks)} trechos relevantes na base de conhecimento:\n\n"

            for i, chunk in enumerate(chunks, 1):
                content, chunk_index, doc_name, collection_name, similarity = chunk
                similarity_pct = round(similarity * 100, 1)

                formatted_output += f"--- TRECHO {i} (Relevância: {similarity_pct}%) ---\n"
                formatted_output += f"Documento: {doc_name}\n"
                formatted_output += f"Coleção: {collection_name}\n"
                formatted_output += f"Parte: {chunk_index + 1}\n\n"
                formatted_output += f"{content}\n"
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
