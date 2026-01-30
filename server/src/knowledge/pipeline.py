"""Pipeline de processamento de documentos."""

import logging
import uuid

from sqlmodel import Session

from src.database.entities import Document, DocumentChunk, DocumentStatus
from .services import (
    StorageService,
    ExtractionService,
    ChunkingService,
    EmbeddingService,
)
from .config import (
    ConfigurationError,
    get_storage_service,
    get_extraction_service,
    get_chunking_service,
    get_embedding_service,
)

logger = logging.getLogger(__name__)


class PipelineError(Exception):
    """Erro durante o pipeline de processamento."""

    pass


class DocumentPipeline:
    """Pipeline de processamento de documentos: download -> extracao -> chunks -> embeddings."""

    def __init__(
        self,
        db: Session,
        storage: StorageService,
        extraction: ExtractionService,
        chunking: ChunkingService,
        embedding: EmbeddingService,
    ):
        """Inicializa o pipeline com servicos injetados.

        Args:
            db: Sessao do banco de dados
            storage: Servico de armazenamento
            extraction: Servico de extracao de texto
            chunking: Servico de divisao em chunks
            embedding: Servico de geracao de embeddings
        """
        self.db = db
        self.storage = storage
        self.extraction = extraction
        self.chunking = chunking
        self.embedding = embedding

    @classmethod
    def create(cls, db: Session, organization_id: uuid.UUID) -> "DocumentPipeline":
        """Factory para criar um pipeline configurado para a organizacao.

        Args:
            db: Sessao do banco de dados
            organization_id: ID da organizacao

        Returns:
            DocumentPipeline configurado

        Raises:
            ConfigurationError: Se algum servico nao estiver configurado
        """
        storage = get_storage_service(db, organization_id)
        extraction = get_extraction_service()

        # Embedding primeiro (necessario para chunking SEMANTIC)
        embedding = get_embedding_service(db, organization_id)
        if not embedding:
            raise ConfigurationError("Servico de embedding nao configurado")

        # Chunking recebe embedding para estrategia SEMANTIC
        chunking = get_chunking_service(db, organization_id, embedding_service=embedding)

        return cls(
            db=db,
            storage=storage,
            extraction=extraction,
            chunking=chunking,
            embedding=embedding,
        )

    def process(self, document: Document) -> None:
        """Executa o pipeline completo de processamento.

        Etapas:
        1. Atualiza status para PROCESSING
        2. Download do arquivo do S3
        3. Extrai texto e salva em document.content
        4. Divide texto em chunks
        5. Gera embeddings para os chunks
        6. Salva DocumentChunks no banco
        7. Atualiza status para COMPLETED

        Args:
            document: Documento a ser processado

        Raises:
            PipelineError: Se houver erro em qualquer etapa
        """
        logger.info(f"Iniciando pipeline para documento {document.id}")

        try:
            # 1. Atualiza status para PROCESSING
            document.status = DocumentStatus.PROCESSING
            self.db.add(document)
            self.db.commit()

            # 2. Download do arquivo
            file_bytes = self.storage.download(document.file_key)
            logger.info(f"Arquivo baixado: {len(file_bytes)} bytes")

            # 3. Extrai texto
            text = self.extraction.extract_text(file_bytes, document.mime_type)

            if not text or not text.strip():
                raise PipelineError("Documento sem texto extraivel")

            # Salva conteudo no documento
            document.content = text
            self.db.add(document)
            self.db.commit()
            logger.info(f"Texto extraido: {len(text)} caracteres")

            # 4. Divide em chunks
            chunks = self.chunking.split(text)

            if not chunks:
                raise PipelineError("Nenhum chunk gerado do documento")

            logger.info(f"Texto dividido em {len(chunks)} chunks")

            # 5. Gera embeddings
            chunk_texts = [chunk.content for chunk in chunks]
            embeddings = self.embedding.embed(chunk_texts)
            logger.info(f"Gerados {len(embeddings)} embeddings")

            # 6. Salva chunks com embeddings
            for chunk, embedding in zip(chunks, embeddings):
                db_chunk = DocumentChunk(
                    document_id=document.id,
                    content=chunk.content,
                    embedding=embedding,
                    chunk_index=chunk.index,
                    chunk_metadata=chunk.metadata,
                )
                self.db.add(db_chunk)

            # 7. Atualiza documento como COMPLETED
            document.status = DocumentStatus.COMPLETED
            document.chunk_count = len(chunks)
            document.error_message = None
            self.db.add(document)
            self.db.commit()

            logger.info(
                f"Documento {document.id} processado com sucesso: {len(chunks)} chunks"
            )

        except Exception as e:
            logger.error(f"Erro ao processar documento {document.id}: {e}")
            # Atualiza status para FAILED
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)[:500]
            self.db.add(document)
            self.db.commit()
            raise PipelineError(str(e)) from e

    def delete_files(self, document: Document) -> None:
        """Remove os arquivos de um documento do S3.

        Args:
            document: Documento cujos arquivos serao removidos
        """
        try:
            self.storage.delete(document.file_key)
            logger.info(f"Arquivo removido do S3: {document.file_key}")
        except Exception as e:
            logger.error(f"Erro ao remover arquivo do S3: {e}")
            # Nao propaga o erro para nao impedir a remocao do documento do banco
