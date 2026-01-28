import uuid

from fastapi import APIRouter, Query

from src.auth import CurrentMembershipDependency, CurrentUserDependency
from src.database import DatabaseDependency

from .schemas import ModelsResponse
from .service import get_available_models as get_available_models_service

router = APIRouter(prefix="/organizations/{organization_id}/models", tags=["models"])


@router.get("", response_model=ModelsResponse)
def get_available_models(
    organization_id: uuid.UUID,
    current_user: CurrentUserDependency,
    membership: CurrentMembershipDependency,
    db: DatabaseDependency,
    provider: str | None = Query(default=None, description="Provedor especifico para buscar modelos"),
):
    """Retorna modelos disponiveis baseado no provedor da organizacao."""
    return get_available_models_service(organization_id, db, provider)
