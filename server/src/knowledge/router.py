"""Routers para collections e documents (knowledge)."""

import uuid
from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import (
    CollectionDetailResponse,
    CollectionListResponse,
    CollectionResponse,
    CreateCollectionRequest,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentResponse,
    UpdateCollectionRequest,
)
from .service import (
    create_collection as create_collection_service,
    delete_collection as delete_collection_service,
    delete_document as delete_document_service,
    get_collection as get_collection_service,
    get_document as get_document_service,
    list_collections as list_collections_service,
    list_documents as list_documents_service,
    update_collection as update_collection_service,
    upload_document as upload_document_service,
)

# =============================================================================
# Collections Router
# =============================================================================

collections_router = APIRouter(
    prefix="/organizations/{organization_id}/collections",
    tags=["collections"],
)


@collections_router.get("", response_model=CollectionListResponse)
def list_collections(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Lista todas as colecoes da organizacao (requer COLLECTIONS_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.COLLECTIONS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao COLLECTIONS_READ necessaria",
        )
    return list_collections_service(organization_id, db)


@collections_router.get("/{collection_id}", response_model=CollectionDetailResponse)
def get_collection(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Retorna detalhes de uma colecao (requer COLLECTIONS_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.COLLECTIONS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao COLLECTIONS_READ necessaria",
        )
    return get_collection_service(organization_id, collection_id, db)


@collections_router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    organization_id: uuid.UUID,
    payload: CreateCollectionRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Cria uma nova colecao (requer COLLECTIONS_CREATE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.COLLECTIONS_CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao COLLECTIONS_CREATE necessaria",
        )
    return create_collection_service(organization_id, payload.name, payload.description, db)


@collections_router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    payload: UpdateCollectionRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza uma colecao (requer COLLECTIONS_UPDATE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.COLLECTIONS_UPDATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao COLLECTIONS_UPDATE necessaria",
        )
    return update_collection_service(organization_id, collection_id, payload.name, payload.description, db)


@collections_router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Remove uma colecao e todos os seus documentos (requer COLLECTIONS_DELETE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.COLLECTIONS_DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao COLLECTIONS_DELETE necessaria",
        )
    delete_collection_service(organization_id, collection_id, db)


# =============================================================================
# Documents Router
# =============================================================================

documents_router = APIRouter(
    prefix="/organizations/{organization_id}/collections/{collection_id}/documents",
    tags=["documents"],
)


@documents_router.get("", response_model=DocumentListResponse)
def list_documents(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Lista todos os documentos de uma colecao (requer DOCUMENTS_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.DOCUMENTS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao DOCUMENTS_READ necessaria",
        )
    return list_documents_service(organization_id, collection_id, db)


@documents_router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Retorna detalhes de um documento com URL de download (requer DOCUMENTS_READ)."""
    if not check_permission(db, current_user.id, organization_id, Permission.DOCUMENTS_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao DOCUMENTS_READ necessaria",
        )
    return get_document_service(organization_id, collection_id, document_id, db)


@documents_router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
    file: UploadFile = File(...),
):
    """Upload de documento PDF (requer DOCUMENTS_CREATE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.DOCUMENTS_CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao DOCUMENTS_CREATE necessaria",
        )
    return await upload_document_service(organization_id, collection_id, file, db)


@documents_router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    organization_id: uuid.UUID,
    collection_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Remove um documento e seus chunks (requer DOCUMENTS_DELETE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.DOCUMENTS_DELETE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao DOCUMENTS_DELETE necessaria",
        )
    delete_document_service(organization_id, collection_id, document_id, db)
