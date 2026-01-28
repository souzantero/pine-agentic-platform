"""Logica de negocio para collections e documents."""

import logging
import uuid
from typing import List

from fastapi import HTTPException, UploadFile, status
from sqlmodel import Session, func, select

from src.database.entities import Document, DocumentCollection, DocumentStatus
from .document_processor import DocumentProcessor, DocumentProcessorError

from .schemas import (
    CollectionDetailResponse,
    CollectionListResponse,
    CollectionResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentResponse,
)

logger = logging.getLogger(__name__)

# Limite de tamanho de arquivo: 50 MB
MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_MIME_TYPES = ["application/pdf"]


# =============================================================================
# Helpers
# =============================================================================


def collection_to_response(collection: DocumentCollection, document_count: int = 0) -> CollectionResponse:
    """Converte entidade para response."""
    return CollectionResponse(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        document_count=document_count,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
    )


def document_to_response(document: Document) -> DocumentResponse:
    """Converte entidade para response."""
    return DocumentResponse(
        id=document.id,
        name=document.name,
        file_size=document.file_size,
        mime_type=document.mime_type,
        status=document.status.value,
        error_message=document.error_message,
        chunk_count=document.chunk_count,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def get_collection_or_404(
    db: Session, organization_id: uuid.UUID, collection_id: uuid.UUID
) -> DocumentCollection:
    """Busca colecao ou levanta 404."""
    statement = select(DocumentCollection).where(
        DocumentCollection.id == collection_id,
        DocumentCollection.organization_id == organization_id,
    )
    collection = db.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colecao nao encontrada",
        )

    return collection


# =============================================================================
# Collection Service
# =============================================================================


def list_collections(organization_id: uuid.UUID, db: Session) -> CollectionListResponse:
    """Lista todas as colecoes da organizacao."""
    statement = (
        select(
            DocumentCollection,
            func.count(Document.id).label("document_count"),
        )
        .outerjoin(Document, Document.collection_id == DocumentCollection.id)
        .where(DocumentCollection.organization_id == organization_id)
        .group_by(DocumentCollection.id)
        .order_by(DocumentCollection.updated_at.desc())
    )

    results = db.exec(statement).all()

    collections = [
        collection_to_response(collection, document_count)
        for collection, document_count in results
    ]

    return CollectionListResponse(collections=collections)


def get_collection(
    organization_id: uuid.UUID, collection_id: uuid.UUID, db: Session
) -> CollectionDetailResponse:
    """Retorna detalhes de uma colecao."""
    statement = (
        select(
            DocumentCollection,
            func.count(Document.id).label("document_count"),
        )
        .outerjoin(Document, Document.collection_id == DocumentCollection.id)
        .where(
            DocumentCollection.id == collection_id,
            DocumentCollection.organization_id == organization_id,
        )
        .group_by(DocumentCollection.id)
    )

    result = db.exec(statement).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colecao nao encontrada",
        )

    collection, document_count = result

    return CollectionDetailResponse(
        id=collection.id,
        name=collection.name,
        description=collection.description,
        document_count=document_count,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
    )


def create_collection(
    organization_id: uuid.UUID, name: str, description: str | None, db: Session
) -> CollectionResponse:
    """Cria uma nova colecao."""
    if not name or not name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome da colecao e obrigatorio",
        )

    collection = DocumentCollection(
        organization_id=organization_id,
        name=name.strip(),
        description=description.strip() if description else None,
    )

    db.add(collection)
    db.commit()
    db.refresh(collection)

    return collection_to_response(collection, 0)


def update_collection(
    organization_id: uuid.UUID, collection_id: uuid.UUID,
    name: str | None, description: str | None, db: Session
) -> CollectionResponse:
    """Atualiza uma colecao."""
    statement = select(DocumentCollection).where(
        DocumentCollection.id == collection_id,
        DocumentCollection.organization_id == organization_id,
    )
    collection = db.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colecao nao encontrada",
        )

    if name is not None:
        if not name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome da colecao nao pode ser vazio",
            )
        collection.name = name.strip()

    if description is not None:
        collection.description = description.strip() if description else None

    db.add(collection)
    db.commit()
    db.refresh(collection)

    count_statement = select(func.count(Document.id)).where(Document.collection_id == collection_id)
    document_count = db.exec(count_statement).one()

    return collection_to_response(collection, document_count)


def delete_collection(organization_id: uuid.UUID, collection_id: uuid.UUID, db: Session) -> None:
    """Remove uma colecao e todos os seus documentos."""
    statement = select(DocumentCollection).where(
        DocumentCollection.id == collection_id,
        DocumentCollection.organization_id == organization_id,
    )
    collection = db.exec(statement).first()

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colecao nao encontrada",
        )

    # Remove arquivos do S3 para cada documento
    try:
        processor = DocumentProcessor(db, organization_id)
        for document in collection.documents:
            try:
                processor.delete_document_files(document)
            except DocumentProcessorError:
                pass
    except DocumentProcessorError:
        pass

    db.delete(collection)
    db.commit()


# =============================================================================
# Document Service
# =============================================================================


def list_documents(
    organization_id: uuid.UUID, collection_id: uuid.UUID, db: Session
) -> DocumentListResponse:
    """Lista todos os documentos de uma colecao."""
    get_collection_or_404(db, organization_id, collection_id)

    statement = (
        select(Document)
        .where(Document.collection_id == collection_id)
        .order_by(Document.created_at.desc())
    )
    documents = db.exec(statement).all()

    return DocumentListResponse(documents=[document_to_response(d) for d in documents])


def get_document(
    organization_id: uuid.UUID, collection_id: uuid.UUID, document_id: uuid.UUID, db: Session
) -> DocumentDetailResponse:
    """Retorna detalhes de um documento com URL de download."""
    get_collection_or_404(db, organization_id, collection_id)

    statement = select(Document).where(
        Document.id == document_id,
        Document.collection_id == collection_id,
    )
    document = db.exec(statement).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento nao encontrado",
        )

    download_url = None
    try:
        processor = DocumentProcessor(db, organization_id)
        s3 = processor._get_s3_service()
        download_url = s3.generate_presigned_url(document.file_key, expiration=3600)
    except DocumentProcessorError as e:
        logger.warning(f"Nao foi possivel gerar URL de download: {e}")

    return DocumentDetailResponse(
        id=document.id,
        name=document.name,
        file_size=document.file_size,
        mime_type=document.mime_type,
        status=document.status.value,
        error_message=document.error_message,
        chunk_count=document.chunk_count,
        download_url=download_url,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


async def upload_document(
    organization_id: uuid.UUID, collection_id: uuid.UUID, file: UploadFile, db: Session
) -> DocumentResponse:
    """Upload de documento PDF."""
    get_collection_or_404(db, organization_id, collection_id)

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo nao suportado: {file.content_type}. Apenas PDF e aceito.",
        )

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo muito grande. Tamanho maximo: {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio",
        )

    try:
        processor = DocumentProcessor(db, organization_id)
        s3 = processor._get_s3_service()
    except DocumentProcessorError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    try:
        file_key = s3.upload_file(
            content=content,
            filename=file.filename or "document.pdf",
            content_type=file.content_type or "application/pdf",
            organization_id=organization_id,
        )
    except Exception as e:
        logger.error(f"Erro ao enviar arquivo para S3: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar arquivo para armazenamento",
        )

    document = Document(
        collection_id=collection_id,
        name=file.filename or "document.pdf",
        file_key=file_key,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        status=DocumentStatus.PENDING,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        processor.process_document(document)
        db.refresh(document)
    except DocumentProcessorError as e:
        logger.error(f"Erro ao processar documento: {e}")
        db.refresh(document)

    return document_to_response(document)


def delete_document(
    organization_id: uuid.UUID, collection_id: uuid.UUID, document_id: uuid.UUID, db: Session
) -> None:
    """Remove um documento e seus chunks."""
    get_collection_or_404(db, organization_id, collection_id)

    statement = select(Document).where(
        Document.id == document_id,
        Document.collection_id == collection_id,
    )
    document = db.exec(statement).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento nao encontrado",
        )

    try:
        processor = DocumentProcessor(db, organization_id)
        processor.delete_document_files(document)
    except DocumentProcessorError:
        pass

    db.delete(document)
    db.commit()
