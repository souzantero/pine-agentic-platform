import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth import CurrentUser, check_permission
from src.database import DatabaseSession
from src.entities import Organization, OrganizationInvite, OrganizationMember, Permission, Role
from src.schemas import (
    CreateInviteRequest,
    InviteCreatedByResponse,
    InviteInfoCreatedBy,
    InviteInfoOrganization,
    InviteInfoResponse,
    InviteInfoRole,
    InviteListItemResponse,
    InviteResponse,
    OrganizationResponse,
    RoleResponse,
)

router = APIRouter(tags=["invites"])


def generate_invite_token() -> str:
    """Gera um token unico para o convite."""
    return secrets.token_urlsafe(32)


def get_invite_link(token: str) -> str:
    """Gera o link completo do convite."""
    # TODO: usar variavel de ambiente para URL base
    return f"http://localhost:3000/invite/{token}"


@router.get(
    "/organizations/{organization_id}/invites",
    response_model=List[InviteListItemResponse],
)
def list_invites(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Lista convites pendentes da organizacao (requer MEMBERS_INVITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_INVITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_INVITE necessaria",
        )

    # Busca convites pendentes (nao usados e nao expirados)
    now = datetime.now(UTC)
    statement = (
        select(OrganizationInvite)
        .where(
            OrganizationInvite.organization_id == organization_id,
            OrganizationInvite.used_at == None,  # noqa: E711
        )
        .order_by(OrganizationInvite.created_at.desc())
    )
    invites = db.exec(statement).all()

    result = []
    for invite in invites:
        # Verifica se expirou
        expires_at = invite.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at < now:
            continue  # Pula convites expirados

        # Carrega relacionamentos
        db.refresh(invite, ["role", "created_by"])

        result.append(
            InviteListItemResponse(
                id=invite.id,
                token=invite.token,
                invite_link=get_invite_link(invite.token),
                role=RoleResponse(
                    id=invite.role.id,
                    name=invite.role.name,
                    description=invite.role.description,
                ),
                created_by=InviteCreatedByResponse(
                    id=invite.created_by.id,
                    name=invite.created_by.name,
                    email=invite.created_by.email,
                ),
                expires_at=invite.expires_at,
                created_at=invite.created_at,
            )
        )

    return result


@router.post(
    "/organizations/{organization_id}/invites",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invite(
    organization_id: uuid.UUID,
    payload: CreateInviteRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Cria um convite para a organizacao (requer MEMBERS_INVITE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.MEMBERS_INVITE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao MEMBERS_INVITE necessaria",
        )

    # Verifica se a organizacao existe
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    # Verifica se a role existe e pertence a organizacao
    role = db.get(Role, payload.role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role nao encontrada nesta organizacao",
        )

    # Cria o convite
    invite = OrganizationInvite(
        organization_id=organization_id,
        role_id=payload.role_id,
        token=generate_invite_token(),
        created_by_id=current_user.id,
        expires_at=datetime.now(UTC) + timedelta(days=payload.expires_in_days),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return InviteResponse(
        id=invite.id,
        token=invite.token,
        invite_link=get_invite_link(invite.token),
        organization=OrganizationResponse(
            id=organization.id,
            name=organization.name,
            slug=organization.slug,
            created_at=organization.created_at,
        ),
        role=RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
        ),
        expires_at=invite.expires_at,
        created_at=invite.created_at,
    )


@router.get("/invites/{token}", response_model=InviteInfoResponse)
def get_invite_info(token: str, db: DatabaseSession):
    """Retorna informacoes publicas do convite (para pagina de aceite)."""
    # Busca o convite pelo token
    statement = select(OrganizationInvite).where(OrganizationInvite.token == token)
    invite = db.exec(statement).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite nao encontrado",
        )

    # Carrega relacionamentos
    db.refresh(invite, ["organization", "role", "created_by"])

    now = datetime.now(UTC)
    # Compara como naive datetime se expires_at nao tem timezone
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    is_expired = expires_at < now
    is_used = invite.used_at is not None

    return InviteInfoResponse(
        organization=InviteInfoOrganization(
            name=invite.organization.name,
            slug=invite.organization.slug,
        ),
        role=InviteInfoRole(
            name=invite.role.name,
        ),
        created_by=InviteInfoCreatedBy(
            name=invite.created_by.name,
        ),
        expires_at=invite.expires_at,
        is_expired=is_expired,
        is_used=is_used,
    )


@router.post("/invites/{token}/accept", status_code=status.HTTP_201_CREATED)
def accept_invite(token: str, current_user: CurrentUser, db: DatabaseSession):
    """Aceita um convite e adiciona o usuario a organizacao."""
    # Busca o convite pelo token
    statement = select(OrganizationInvite).where(OrganizationInvite.token == token)
    invite = db.exec(statement).first()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Convite nao encontrado",
        )

    # Verifica se ja foi usado
    if invite.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Convite ja foi utilizado",
        )

    # Verifica se expirou
    now = datetime.now(UTC)
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Convite expirado",
        )

    # Verifica se usuario ja e membro
    member_statement = select(OrganizationMember).where(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.organization_id == invite.organization_id,
    )
    existing_member = db.exec(member_statement).first()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voce ja e membro desta organizacao",
        )

    # Cria o membership
    member = OrganizationMember(
        user_id=current_user.id,
        organization_id=invite.organization_id,
        role_id=invite.role_id,
        is_owner=False,
    )
    db.add(member)

    # Marca convite como usado
    invite.used_at = now
    invite.used_by_id = current_user.id
    db.add(invite)

    db.commit()

    return {"message": "Convite aceito com sucesso"}
