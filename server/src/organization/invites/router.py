import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status

from src.auth import CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import CreateInviteRequest, InviteInfoResponse, InviteListItemResponse, InviteResponse
from .service import (
    accept_invite as accept_invite_service,
    create_invite as create_invite_service,
    get_invite_info as get_invite_info_service,
    list_invites as list_invites_service,
)

router = APIRouter(tags=["invites"])


@router.get(
    "/organizations/{organization_id}/invites",
    response_model=List[InviteListItemResponse],
)
def list_invites(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Lista convites pendentes da organizacao (requer MEMBERS_INVITE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_INVITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_INVITE necessaria",
        )
    return list_invites_service(organization_id, db)


@router.post(
    "/organizations/{organization_id}/invites",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invite(
    organization_id: uuid.UUID,
    payload: CreateInviteRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Cria um convite para a organizacao (requer MEMBERS_INVITE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_INVITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_INVITE necessaria",
        )
    return create_invite_service(organization_id, payload, current_user.id, db)


@router.get("/invites/{token}", response_model=InviteInfoResponse)
def get_invite_info(token: str, db: DatabaseDependency):
    """Retorna informacoes publicas do convite (para pagina de aceite)."""
    return get_invite_info_service(token, db)


@router.post("/invites/{token}/accept", status_code=status.HTTP_201_CREATED)
def accept_invite(token: str, current_user: CurrentUserDependency, db: DatabaseDependency):
    """Aceita um convite e adiciona o usuario a organizacao."""
    return accept_invite_service(token, current_user.id, db)
