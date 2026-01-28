from fastapi import APIRouter, status

from src.database import DatabaseDependency

from .dependencies import CurrentUserDependency
from .schemas import MeResponse, TokenResponse, LoginRequest, RegisterRequest
from .service import get_current_user_info, login_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DatabaseDependency):
    """Registra um novo usuario."""
    return register_user(payload, db)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DatabaseDependency):
    """Autentica um usuario e retorna o token JWT."""
    return login_user(payload, db)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: CurrentUserDependency, db: DatabaseDependency):
    """Retorna o usuario autenticado com suas memberships."""
    return get_current_user_info(current_user, db)
