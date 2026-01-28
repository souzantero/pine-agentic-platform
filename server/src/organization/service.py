import uuid

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import (
    Organization,
    OrganizationMember,
    Permission,
    Role,
    RolePermission,
    RoleScope,
    User,
)

from .schemas import CreateOrganizationRequest, OrganizationDetailResponse, UpdateOrganizationRequest

# Permissoes padrao para role Admin
ADMIN_PERMISSIONS = [
    Permission.THREADS_READ,
    Permission.THREADS_WRITE,
    Permission.THREADS_DELETE,
    Permission.AGENTS_READ,
    Permission.AGENTS_WRITE,
    Permission.AGENTS_DELETE,
    Permission.MEMBERS_READ,
    Permission.MEMBERS_INVITE,
    Permission.MEMBERS_MANAGE,
    Permission.ROLES_READ,
    Permission.ROLES_MANAGE,
    Permission.ORGANIZATION_MANAGE,
    Permission.COLLECTIONS_READ,
    Permission.COLLECTIONS_CREATE,
    Permission.COLLECTIONS_UPDATE,
    Permission.COLLECTIONS_DELETE,
    Permission.DOCUMENTS_READ,
    Permission.DOCUMENTS_CREATE,
    Permission.DOCUMENTS_UPDATE,
    Permission.DOCUMENTS_DELETE,
]

# Permissoes padrao para role Membro
MEMBER_PERMISSIONS = [
    Permission.THREADS_READ,
    Permission.THREADS_WRITE,
    Permission.AGENTS_READ,
    Permission.MEMBERS_READ,
    Permission.COLLECTIONS_READ,
    Permission.DOCUMENTS_READ,
]


def create_admin_role(db: Session, organization_id: uuid.UUID) -> Role:
    """Cria a role Admin padrao para uma organizacao."""
    role = Role(
        organization_id=organization_id,
        scope=RoleScope.ORGANIZATION,
        name="Admin",
        description="Administrador com acesso total",
        is_system_role=True,
    )
    db.add(role)
    db.flush()

    for permission in ADMIN_PERMISSIONS:
        role_permission = RolePermission(
            role_id=role.id,
            permission=permission,
        )
        db.add(role_permission)

    return role


def create_member_role(db: Session, organization_id: uuid.UUID) -> Role:
    """Cria a role Membro padrao para uma organizacao."""
    role = Role(
        organization_id=organization_id,
        scope=RoleScope.ORGANIZATION,
        name="Membro",
        description="Membro com acesso basico",
        is_system_role=True,
    )
    db.add(role)
    db.flush()

    for permission in MEMBER_PERMISSIONS:
        role_permission = RolePermission(
            role_id=role.id,
            permission=permission,
        )
        db.add(role_permission)

    return role


def get_organization_by_id(db: Session, organization_id: uuid.UUID) -> Organization | None:
    """Retorna a organizacao pelo ID."""
    return db.get(Organization, organization_id)


def create_organization(
    payload: CreateOrganizationRequest, user: User, db: Session
) -> OrganizationDetailResponse:
    """Cria uma nova organizacao e adiciona o usuario como owner."""
    statement = select(Organization).where(Organization.slug == payload.slug)
    existing_org = db.exec(statement).first()

    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug ja esta em uso",
        )

    organization = Organization(
        name=payload.name,
        slug=payload.slug,
    )
    db.add(organization)
    db.flush()

    admin_role = create_admin_role(db, organization.id)
    create_member_role(db, organization.id)

    member = OrganizationMember(
        user_id=user.id,
        organization_id=organization.id,
        role_id=admin_role.id,
        is_owner=True,
    )
    db.add(member)
    db.commit()
    db.refresh(organization)

    return OrganizationDetailResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


def get_organization(organization_id: uuid.UUID, db: Session) -> OrganizationDetailResponse:
    """Retorna detalhes de uma organizacao."""
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    return OrganizationDetailResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


def update_organization(
    organization_id: uuid.UUID, payload: UpdateOrganizationRequest, db: Session
) -> OrganizationDetailResponse:
    """Atualiza configuracoes da organizacao."""
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    if payload.name is not None:
        organization.name = payload.name

    if payload.slug is not None:
        statement = select(Organization).where(
            Organization.slug == payload.slug,
            Organization.id != organization_id,
        )
        existing = db.exec(statement).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug ja esta em uso",
            )
        organization.slug = payload.slug

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return OrganizationDetailResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )
