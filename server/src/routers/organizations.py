import uuid

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from src.auth import CurrentUser, check_permission, get_user_membership
from src.database import DatabaseSession
from src.entities import (
    ModelProvider,
    Organization,
    OrganizationMember,
    Permission,
    Role,
    RolePermission,
    RoleScope,
)
from src.schemas import (
    CreateOrganizationRequest,
    OrganizationDetailResponse,
    UpdateOrganizationRequest,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


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
    Permission.PROMPTS_READ,
    Permission.PROMPTS_WRITE,
    Permission.PROMPTS_DELETE,
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
    db.flush()  # Para obter o ID da role

    # Adiciona todas as permissoes de admin
    for permission in ADMIN_PERMISSIONS:
        role_permission = RolePermission(
            role_id=role.id,
            permission=permission,
        )
        db.add(role_permission)

    return role


@router.post("", response_model=OrganizationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: CreateOrganizationRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Cria uma nova organizacao e adiciona o usuario como owner."""
    # Verifica se slug ja existe
    statement = select(Organization).where(Organization.slug == payload.slug)
    existing_org = db.exec(statement).first()

    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug ja esta em uso",
        )

    # Cria a organizacao
    organization = Organization(
        name=payload.name,
        slug=payload.slug,
    )
    db.add(organization)
    db.flush()  # Para obter o ID

    # Cria a role Admin padrao
    admin_role = create_admin_role(db, organization.id)

    # Adiciona o usuario como membro owner
    member = OrganizationMember(
        user_id=current_user.id,
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
        default_model_provider=organization.default_model_provider.value if organization.default_model_provider else None,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


@router.get("/{organization_id}", response_model=OrganizationDetailResponse)
def get_organization(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Retorna detalhes de uma organizacao (usuario deve ser membro)."""
    # Verifica se usuario e membro
    membership = get_user_membership(db, current_user.id, organization_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce nao e membro desta organizacao",
        )

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
        default_model_provider=organization.default_model_provider.value if organization.default_model_provider else None,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


@router.put("/{organization_id}", response_model=OrganizationDetailResponse)
def update_organization(
    organization_id: uuid.UUID,
    payload: UpdateOrganizationRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Atualiza configuracoes da organizacao (requer ORGANIZATION_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )

    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    # Atualiza campos
    if payload.name is not None:
        organization.name = payload.name

    if payload.slug is not None:
        # Verifica se novo slug ja existe
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

    if payload.default_model_provider is not None:
        try:
            organization.default_model_provider = ModelProvider(payload.default_model_provider)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provedor invalido. Valores aceitos: {[p.value for p in ModelProvider]}",
            )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return OrganizationDetailResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        default_model_provider=organization.default_model_provider.value if organization.default_model_provider else None,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )
