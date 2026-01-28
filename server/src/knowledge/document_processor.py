"""Servico de processamento de documentos."""

import logging
import uuid

from sqlmodel import Session, select

from src.database.entities import (
    Document,
    DocumentChunk,
    DocumentStatus,
    OrganizationProvider,
    OrganizationConfig,
    ProviderType,
    Provider,
    ConfigType,
    ConfigKey,
)
from src.core.storage import S3Service
from src.core.embedding import EmbeddingService, get_embedding_config

logger = logging.getLogger(__name__)


class DocumentProcessorError(Exception):
    """Erro durante processamento de documento."""

    pass


class DocumentProcessor:
    """Orquestra o processamento de documentos: download, extracao, embedding e persistencia."""

    def __init__(self, db: Session, organization_id: uuid.UUID):
        """Inicializa o processador de documentos.

        Args:
            db: Sessao do banco de dados
            organization_id: ID da organizacao
        """
        self.db = db
        self.organization_id = organization_id
        self._s3_service: S3Service | None = None
        self._embedding_service: EmbeddingService | None = None

    def _get_s3_service(self) -> S3Service:
        """Obtem o servico S3 configurado para a organizacao."""
        if self._s3_service:
            return self._s3_service

        # Busca credenciais do provider S3
        statement = select(OrganizationProvider).where(
            OrganizationProvider.organization_id == self.organization_id,
            OrganizationProvider.type == ProviderType.STORAGE,
            OrganizationProvider.provider == Provider.AWS_S3,
            OrganizationProvider.is_active == True,
        )
        provider = self.db.exec(statement).first()

        if not provider:
            raise DocumentProcessorError("Provider S3 nao configurado")

        credentials = provider.credentials
        access_key_id = credentials.get("accessKeyId")
        secret_access_key = credentials.get("apiKey")

        if not access_key_id or not secret_access_key:
            raise DocumentProcessorError("Credenciais S3 incompletas")

        # Busca config de conhecimento (storage + embedding)
        config_statement = select(OrganizationConfig).where(
            OrganizationConfig.organization_id == self.organization_id,
            OrganizationConfig.type == ConfigType.FEATURE,
            OrganizationConfig.key == ConfigKey.KNOWLEDGE,
            OrganizationConfig.is_enabled == True,
        )
        knowledge_config = self.db.exec(config_statement).first()

        if not knowledge_config:
            raise DocumentProcessorError("Configuracao de conhecimento nao encontrada")

        storage_settings = knowledge_config.config.get("storage", {})
        bucket = storage_settings.get("bucket")
        region = storage_settings.get("region")

        if not bucket or not region:
            raise DocumentProcessorError("Bucket ou region nao configurados")

        self._s3_service = S3Service(
            access_key_id=access_key_id,
            secret_access_key=secret_access_key,
            region=region,
            bucket=bucket,
        )
        return self._s3_service

    def _get_embedding_service(self) -> EmbeddingService:
        """Obtem o servico de embedding configurado para a organizacao."""
        if self._embedding_service:
            return self._embedding_service

        config = get_embedding_config(self.db, self.organization_id)
        if not config:
            raise DocumentProcessorError("Configuracao de embedding nao encontrada")

        self._embedding_service = EmbeddingService(config)
        return self._embedding_service

    def process_document(self, document: Document) -> None:
        """Processa um documento: download S3 -> extrai texto -> chunks -> embeddings -> salva.

        Args:
            document: Documento a ser processado

        Raises:
            DocumentProcessorError: Se houver erro no processamento
        """
        logger.info(f"Iniciando processamento do documento {document.id}")

        try:
            # 1. Atualiza status para PROCESSING
            document.status = DocumentStatus.PROCESSING
            self.db.add(document)
            self.db.commit()

            # 2. Download do arquivo do S3
            s3 = self._get_s3_service()
            pdf_bytes = s3.download_file(document.file_key)
            logger.info(f"Arquivo baixado: {len(pdf_bytes)} bytes")

            # 3. Processa o PDF (extrai texto, divide em chunks, gera embeddings)
            embedding_service = self._get_embedding_service()
            chunks_with_embeddings = embedding_service.process_pdf(pdf_bytes)

            if not chunks_with_embeddings:
                raise DocumentProcessorError("Nenhum chunk gerado do documento")

            # 4. Salva os chunks no banco
            for chunk_data in chunks_with_embeddings:
                chunk = DocumentChunk(
                    document_id=document.id,
                    content=chunk_data.content,
                    embedding=chunk_data.embedding,
                    chunk_index=chunk_data.chunk_index,
                    chunk_metadata=chunk_data.metadata,
                )
                self.db.add(chunk)

            # 5. Atualiza documento como COMPLETED
            document.status = DocumentStatus.COMPLETED
            document.chunk_count = len(chunks_with_embeddings)
            document.error_message = None
            self.db.add(document)
            self.db.commit()

            logger.info(
                f"Documento {document.id} processado com sucesso: {len(chunks_with_embeddings)} chunks"
            )

        except Exception as e:
            logger.error(f"Erro ao processar documento {document.id}: {e}")
            # Atualiza status para FAILED
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)[:500]  # Limita tamanho da mensagem
            self.db.add(document)
            self.db.commit()
            raise DocumentProcessorError(str(e)) from e

    def delete_document_files(self, document: Document) -> None:
        """Remove os arquivos de um documento do S3.

        Args:
            document: Documento cujos arquivos serao removidos
        """
        try:
            s3 = self._get_s3_service()
            s3.delete_file(document.file_key)
            logger.info(f"Arquivo removido do S3: {document.file_key}")
        except Exception as e:
            logger.error(f"Erro ao remover arquivo do S3: {e}")
            # Nao propaga o erro para nao impedir a remocao do documento do banco
