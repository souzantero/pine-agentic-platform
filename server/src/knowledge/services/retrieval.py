"""Servico de busca hibrida em embeddings usando RRF (Reciprocal Rank Fusion)."""

import logging
import uuid
from dataclasses import dataclass

from sqlalchemy import text
from sqlmodel import Session

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Resultado de uma busca por similaridade."""

    content: str
    chunk_index: int
    document_id: uuid.UUID
    document_name: str
    collection_id: uuid.UUID
    collection_name: str
    score: float
    chunking_strategy: str | None = None


@dataclass
class SearchFilters:
    """Filtros para busca hibrida."""

    organization_id: uuid.UUID
    query_text: str
    query_embedding: list[float]
    collection_id: uuid.UUID | None = None
    chunking_strategy: str | None = None
    similarity_threshold: float | None = None
    max_results: int = 5
    # Pesos para RRF (Reciprocal Rank Fusion)
    vector_weight: float = 1.5
    text_weight: float = 1.0
    rrf_k: int = 60  # Constante k do RRF


class RetrievalService:
    """Servico para busca hibrida combinando vetorial e full-text com RRF."""

    def __init__(self, db: Session):
        """Inicializa o servico de busca.

        Args:
            db: Sessao do banco de dados
        """
        self.db = db

    def _build_where_clause(self, filters: SearchFilters) -> tuple[str, dict]:
        """Constroi a clausula WHERE e parametros baseado nos filtros.

        Args:
            filters: Filtros de busca

        Returns:
            Tupla com (clausula_where, parametros)
        """
        where_clauses = [
            "col.organization_id = :org_id",
            "d.status = 'COMPLETED'",
        ]
        params: dict = {
            "org_id": str(filters.organization_id),
            "max_results": filters.max_results,
        }

        # Filtro por collection
        if filters.collection_id:
            where_clauses.append("col.id = :collection_id")
            params["collection_id"] = str(filters.collection_id)

        # Filtro por estrategia de chunking
        if filters.chunking_strategy:
            where_clauses.append("dc.chunk_metadata->>'chunking_strategy' = :chunking_strategy")
            params["chunking_strategy"] = filters.chunking_strategy

        return " AND ".join(where_clauses), params

    def _rows_to_results(self, rows) -> list[SearchResult]:
        """Converte rows do banco em lista de SearchResult.

        Args:
            rows: Rows retornados pelo banco

        Returns:
            Lista de SearchResult
        """
        return [
            SearchResult(
                content=row.content,
                chunk_index=row.chunk_index,
                document_id=uuid.UUID(str(row.document_id)),
                document_name=row.document_name,
                collection_id=uuid.UUID(str(row.collection_id)),
                collection_name=row.collection_name,
                score=float(row.score) if row.score else 0.0,
                chunking_strategy=row.chunk_metadata.get("chunking_strategy") if row.chunk_metadata else None,
            )
            for row in rows
        ]

    def search(self, filters: SearchFilters) -> list[SearchResult]:
        """Executa busca hibrida combinando vetorial e full-text com RRF.

        Reciprocal Rank Fusion (RRF) combina os rankings de diferentes metodos
        de busca usando a formula: score = sum(weight / (k + rank))

        Args:
            filters: Filtros de busca (query_text e query_embedding obrigatorios)

        Returns:
            Lista de SearchResult ordenados por score RRF combinado
        """
        where_sql, params = self._build_where_clause(filters)
        params["query_embedding"] = filters.query_embedding
        params["query_text"] = filters.query_text
        params["vector_weight"] = filters.vector_weight
        params["text_weight"] = filters.text_weight
        params["rrf_k"] = filters.rrf_k

        # Adiciona threshold se especificado
        threshold_clause = ""
        if filters.similarity_threshold is not None:
            threshold_clause = r"AND 1 - (dc.embedding <=> :query_embedding\:\:vector) >= :threshold"
            params["threshold"] = filters.similarity_threshold

        sql = text(rf"""
            WITH vector_search AS (
                -- Busca vetorial por similaridade de embedding
                SELECT
                    dc.id as chunk_id,
                    dc.content,
                    dc.chunk_index,
                    dc.chunk_metadata,
                    d.id as document_id,
                    d.name as document_name,
                    col.id as collection_id,
                    col.name as collection_name,
                    1 - (dc.embedding <=> :query_embedding\:\:vector) as vector_score,
                    ROW_NUMBER() OVER (ORDER BY dc.embedding <=> :query_embedding\:\:vector) as vector_rank
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                JOIN document_collections col ON d.collection_id = col.id
                WHERE {where_sql}
                {threshold_clause}
                ORDER BY dc.embedding <=> :query_embedding\:\:vector
                LIMIT :max_results
            ),
            fts_query AS (
                SELECT plainto_tsquery('portuguese', :query_text) as tsq
            ),
            text_search AS (
                -- Busca full-text usando tsvector
                SELECT
                    dc.id as chunk_id,
                    dc.content,
                    dc.chunk_index,
                    dc.chunk_metadata,
                    d.id as document_id,
                    d.name as document_name,
                    col.id as collection_id,
                    col.name as collection_name,
                    ts_rank_cd(dc.keywords, fts.tsq) as text_score,
                    ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.keywords, fts.tsq) DESC) as text_rank
                FROM document_chunks dc
                JOIN documents d ON dc.document_id = d.id
                JOIN document_collections col ON d.collection_id = col.id
                CROSS JOIN fts_query fts
                WHERE {where_sql}
                  AND dc.keywords @@ fts.tsq
                ORDER BY text_score DESC
                LIMIT :max_results
            ),
            combined AS (
                -- Combina resultados com FULL OUTER JOIN
                SELECT
                    COALESCE(v.chunk_id, t.chunk_id) as chunk_id,
                    COALESCE(v.chunk_index, t.chunk_index) as chunk_index,
                    COALESCE(v.content, t.content) as content,
                    COALESCE(v.chunk_metadata, t.chunk_metadata) as chunk_metadata,
                    COALESCE(v.document_id, t.document_id) as document_id,
                    COALESCE(v.document_name, t.document_name) as document_name,
                    COALESCE(v.collection_id, t.collection_id) as collection_id,
                    COALESCE(v.collection_name, t.collection_name) as collection_name,
                    v.vector_rank,
                    t.text_rank
                FROM vector_search v
                FULL OUTER JOIN text_search t ON v.chunk_id = t.chunk_id
            ),
            ranked AS (
                -- Calcula score RRF (Reciprocal Rank Fusion)
                SELECT
                    content,
                    chunk_index,
                    chunk_metadata,
                    document_id,
                    document_name,
                    collection_id,
                    collection_name,
                    COALESCE(:vector_weight / (:rrf_k + vector_rank), 0) +
                    COALESCE(:text_weight / (:rrf_k + text_rank), 0) as score
                FROM combined
            )
            SELECT
                content,
                chunk_index,
                chunk_metadata,
                document_id,
                document_name,
                collection_id,
                collection_name,
                score
            FROM ranked
            ORDER BY score DESC
            LIMIT :max_results
        """)

        # Vincula parametros ao objeto text para compatibilidade com SQLModel
        bound_sql = sql.bindparams(**params)
        result = self.db.exec(bound_sql)
        rows = result.all()

        return self._rows_to_results(rows)
