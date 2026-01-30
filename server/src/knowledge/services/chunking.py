"""Servico de divisao de texto em chunks com multiplas estrategias."""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum

from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker

logger = logging.getLogger(__name__)


class ChunkingStrategy(str, Enum):
    """Estrategias disponiveis para chunking."""

    RECURSIVE = "RECURSIVE"  # Divisao por tamanho com separadores
    SEMANTIC = "SEMANTIC"  # Divisao por similaridade semantica


@dataclass
class ChunkingConfig:
    """Configuracao do servico de chunking."""

    strategy: ChunkingStrategy = ChunkingStrategy.RECURSIVE
    chunk_size: int = 1000
    chunk_overlap: int = 200
    # Config especifica para SemanticChunker
    breakpoint_threshold_type: str = "percentile"  # percentile, standard_deviation, interquartile


@dataclass
class TextChunk:
    """Representa um chunk de texto."""

    content: str
    index: int
    metadata: dict = field(default_factory=dict)


class BaseChunker(ABC):
    """Interface base para estrategias de chunking."""

    @property
    @abstractmethod
    def strategy_name(self) -> str:
        """Retorna o nome da estrategia."""
        pass

    @abstractmethod
    def split(self, text: str) -> list[str]:
        """Divide o texto em chunks.

        Args:
            text: Texto completo a ser dividido

        Returns:
            Lista de strings (chunks de texto)
        """
        pass


class RecursiveChunker(BaseChunker):
    """Chunker baseado em tamanho com separadores recursivos."""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """Inicializa o chunker recursivo.

        Args:
            chunk_size: Tamanho maximo de cada chunk
            chunk_overlap: Sobreposicao entre chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    @property
    def strategy_name(self) -> str:
        return ChunkingStrategy.RECURSIVE.value

    def split(self, text: str) -> list[str]:
        return self.splitter.split_text(text)


class SemanticChunkerImpl(BaseChunker):
    """Chunker baseado em similaridade semantica usando embeddings."""

    def __init__(
        self,
        embeddings: OpenAIEmbeddings,
        breakpoint_threshold_type: str = "percentile",
    ):
        """Inicializa o chunker semantico.

        Args:
            embeddings: Cliente de embeddings OpenAI
            breakpoint_threshold_type: Tipo de threshold para quebra
                - percentile: usa percentil da distribuicao de distancias
                - standard_deviation: usa desvio padrao
                - interquartile: usa intervalo interquartil
        """
        self.splitter = SemanticChunker(
            embeddings=embeddings,
            breakpoint_threshold_type=breakpoint_threshold_type,
        )

    @property
    def strategy_name(self) -> str:
        return ChunkingStrategy.SEMANTIC.value

    def split(self, text: str) -> list[str]:
        documents = self.splitter.create_documents([text])
        return [doc.page_content for doc in documents]


class ChunkingService:
    """Servico para divisao de texto em chunks."""

    def __init__(
        self,
        config: ChunkingConfig | None = None,
        embeddings: OpenAIEmbeddings | None = None,
    ):
        """Inicializa o servico de chunking.

        Args:
            config: Configuracao de chunking (usa defaults se None)
            embeddings: Cliente de embeddings (necessario para estrategia SEMANTIC)
        """
        self.config = config or ChunkingConfig()
        self.embeddings = embeddings
        self._chunker: BaseChunker | None = None

    def _get_chunker(self) -> BaseChunker:
        """Obtem ou cria o chunker baseado na estrategia configurada."""
        if self._chunker:
            return self._chunker

        if self.config.strategy == ChunkingStrategy.RECURSIVE:
            self._chunker = RecursiveChunker(
                chunk_size=self.config.chunk_size,
                chunk_overlap=self.config.chunk_overlap,
            )
        elif self.config.strategy == ChunkingStrategy.SEMANTIC:
            if not self.embeddings:
                raise ValueError(
                    "Embeddings client e necessario para estrategia SEMANTIC"
                )
            self._chunker = SemanticChunkerImpl(
                embeddings=self.embeddings,
                breakpoint_threshold_type=self.config.breakpoint_threshold_type,
            )
        else:
            raise ValueError(f"Estrategia de chunking desconhecida: {self.config.strategy}")

        return self._chunker

    def split(self, text: str) -> list[TextChunk]:
        """Divide o texto em chunks usando a estrategia configurada.

        Args:
            text: Texto completo a ser dividido

        Returns:
            Lista de TextChunks com metadados incluindo a estrategia
        """
        if not text or not text.strip():
            logger.warning("Texto vazio recebido para chunking")
            return []

        chunker = self._get_chunker()
        chunks_text = chunker.split(text)

        chunks = [
            TextChunk(
                content=chunk,
                index=i,
                metadata={
                    "chunk_index": i,
                    "total_chunks": len(chunks_text),
                    "chunking_strategy": chunker.strategy_name,
                },
            )
            for i, chunk in enumerate(chunks_text)
        ]

        logger.info(
            f"Texto dividido em {len(chunks)} chunks usando estrategia {chunker.strategy_name}"
        )
        return chunks
