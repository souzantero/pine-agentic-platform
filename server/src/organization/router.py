import uuid

from fastapi import APIRouter, status

from src.auth import CurrentMembershipDependency, CurrentUserDependency, check_permission
from src.database import DatabaseDependency
from src.database.entities import Permission

from .schemas import CreateOrganizationRequest, OrganizationDetailResponse, UpdateOrganizationRequest
from .service import (
    create_organization as create_organization_service,
    get_organization as get_organization_service,
    update_organization as update_organization_service,
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("", response_model=OrganizationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: CreateOrganizationRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Cria uma nova organizacao e adiciona o usuario como owner."""
    return create_organization_service(payload, current_user, db)


@router.get("/{organization_id}", response_model=OrganizationDetailResponse)
def get_organization(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    membership: CurrentMembershipDependency,
    db: DatabaseDependency,
):
    """Retorna detalhes de uma organizacao (usuario deve ser membro)."""
    return get_organization_service(organization_id, db)


@router.put("/{organization_id}", response_model=OrganizationDetailResponse)
def update_organization(
    organization_id: uuid.UUID,
    payload: UpdateOrganizationRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Atualiza configuracoes da organizacao (requer ORGANIZATION_MANAGE)."""
    if not check_permission(db, current_user.id, organization_id, Permission.ORGANIZATION_MANAGE):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Permissao ORGANIZATION_MANAGE necessaria",
        )
    return update_organization_service(organization_id, payload, db)
