"""Servico de embedding e processamento de texto."""

import io
import logging
import uuid
from dataclasses import dataclass

from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlmodel import Session, select

logger = logging.getLogger(__name__)


@dataclass
class EmbeddingConfig:
    """Configuracao de embedding para uma organizacao."""

    api_key: str
    model: str
    chunk_size: int
    chunk_overlap: int


def get_embedding_config(db: Session, organization_id: uuid.UUID) -> EmbeddingConfig | None:
    """Obtem a configuracao de embedding para uma organizacao.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        EmbeddingConfig ou None se nao configurado
    """
    from src.database.entities import (
        OrganizationConfig,
        OrganizationProvider,
        ConfigType,
        ConfigKey,
        ProviderType,
        Provider,
    )

    # Busca config de conhecimento
    config_statement = select(OrganizationConfig).where(
        OrganizationConfig.organization_id == organization_id,
        OrganizationConfig.type == ConfigType.FEATURE,
        OrganizationConfig.key == ConfigKey.KNOWLEDGE,
        OrganizationConfig.is_enabled == True,
    )
    knowledge_config = db.exec(config_statement).first()

    if not knowledge_config:
        logger.warning(f"Conhecimento nao configurado para organizacao {organization_id}")
        return None

    embedding_settings = knowledge_config.config.get("embedding", {})
    provider_str = embedding_settings.get("provider", "OPENAI")
    model = embedding_settings.get("model", "text-embedding-ada-002")
    chunk_size = embedding_settings.get("chunkSize", 1000)
    chunk_overlap = embedding_settings.get("chunkOverlap", 200)

    # Converte string para enum
    try:
        provider_enum = Provider(provider_str)
    except ValueError:
        logger.warning(f"Provider de embedding invalido: {provider_str}")
        return None

    # Busca credenciais do provider
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == ProviderType.EMBEDDING,
        OrganizationProvider.provider == provider_enum,
        OrganizationProvider.is_active == True,
    )
    provider = db.exec(statement).first()

    if not provider:
        logger.warning(f"Provider de embedding {provider_str} nao configurado")
        return None

    api_key = provider.credentials.get("apiKey")
    if not api_key:
        logger.warning("API key de embedding nao encontrada")
        return None

    return EmbeddingConfig(
        api_key=api_key,
        model=model,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )


def create_embeddings_client(config: EmbeddingConfig) -> OpenAIEmbeddings:
    """Cria um cliente de embeddings a partir da configuracao.

    Args:
        config: Configuracao de embedding

    Returns:
        Cliente OpenAIEmbeddings configurado
    """
    return OpenAIEmbeddings(
        openai_api_key=config.api_key,
        model=config.model,
    )


def get_embeddings_client(db: Session, organization_id: uuid.UUID) -> OpenAIEmbeddings | None:
    """Factory que obtem um cliente de embeddings configurado para uma organizacao.

    Combina get_embedding_config e create_embeddings_client em uma unica chamada.

    Args:
        db: Sessao do banco de dados
        organization_id: ID da organizacao

    Returns:
        Cliente OpenAIEmbeddings ou None se nao configurado
    """
    config = get_embedding_config(db, organization_id)
    if not config:
        return None
    return create_embeddings_client(config)


@dataclass
class ChunkWithEmbedding:
    """Chunk de texto com seu embedding."""

    content: str
    embedding: list[float]
    chunk_index: int
    metadata: dict


class EmbeddingService:
    """Servico para extracao de texto e geracao de embeddings."""

    def __init__(self, config: EmbeddingConfig):
        """Inicializa o servico de embedding.

        Args:
            config: Configuracao de embedding (api_key, model, chunk_size, chunk_overlap)
        """
        self.embeddings = create_embeddings_client(config)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self.model = config.model

    @classmethod
    def from_organization(cls, db: Session, organization_id: uuid.UUID) -> "EmbeddingService | None":
        """Cria um EmbeddingService a partir da configuracao da organizacao.

        Args:
            db: Sessao do banco de dados
            organization_id: ID da organizacao

        Returns:
            EmbeddingService configurado ou None se nao configurado
        """
        config = get_embedding_config(db, organization_id)
        if not config:
            return None
        return cls(config)

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extrai texto de um arquivo PDF.

        Args:
            pdf_bytes: Conteudo do PDF em bytes

        Returns:
            Texto extraido do PDF

        Raises:
            Exception: Se houver erro na extracao
        """
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)

            text_parts = []
            for page_num, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"[Página {page_num}]\n{page_text}")

            full_text = "\n\n".join(text_parts)
            logger.info(f"Texto extraido: {len(full_text)} caracteres de {len(reader.pages)} paginas")
            return full_text
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF: {e}")
            raise

    def chunk_text(self, text: str) -> list[str]:
        """Divide o texto em chunks menores.

        Args:
            text: Texto completo a ser dividido

        Returns:
            Lista de chunks de texto
        """
        chunks = self.text_splitter.split_text(text)
        logger.info(f"Texto dividido em {len(chunks)} chunks")
        return chunks

    def generate_embeddings(self, chunks: list[str]) -> list[list[float]]:
        """Gera embeddings para uma lista de chunks.

        Args:
            chunks: Lista de textos para gerar embeddings

        Returns:
            Lista de embeddings (vetores de floats)

        Raises:
            Exception: Se houver erro na geracao
        """
        try:
            embeddings = self.embeddings.embed_documents(chunks)
            logger.info(f"Gerados {len(embeddings)} embeddings")
            return embeddings
        except Exception as e:
            logger.error(f"Erro ao gerar embeddings: {e}")
            raise

    def process_pdf(self, pdf_bytes: bytes) -> list[ChunkWithEmbedding]:
        """Processa um PDF completo: extrai texto, divide em chunks e gera embeddings.

        Args:
            pdf_bytes: Conteudo do PDF em bytes

        Returns:
            Lista de ChunkWithEmbedding com texto e embedding

        Raises:
            Exception: Se houver erro em qualquer etapa
        """
        # 1. Extrair texto
        text = self.extract_text_from_pdf(pdf_bytes)

        if not text.strip():
            logger.warning("PDF sem texto extraivel")
            return []

        # 2. Dividir em chunks
        chunks = self.chunk_text(text)

        if not chunks:
            logger.warning("Nenhum chunk gerado")
            return []

        # 3. Gerar embeddings
        embeddings = self.generate_embeddings(chunks)

        # 4. Combinar chunks com embeddings
        results = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            results.append(
                ChunkWithEmbedding(
                    content=chunk,
                    embedding=embedding,
                    chunk_index=i,
                    metadata={"chunk_index": i, "total_chunks": len(chunks)},
                )
            )

        logger.info(f"PDF processado: {len(results)} chunks com embeddings")
        return results
