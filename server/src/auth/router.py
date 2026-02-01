from fastapi import APIRouter, status

from src.database import DatabaseDependency

from .dependencies import CurrentUserDependency
from .schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MeResponse,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from .service import (
    change_password,
    forgot_password,
    get_current_user_info,
    login_user,
    register_user,
    resend_verification_email,
    reset_password,
    verify_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DatabaseDependency):
    """Registra um novo usuario e envia email de verificacao."""
    return register_user(payload, db)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DatabaseDependency):
    """Autentica um usuario e retorna o token JWT."""
    return login_user(payload, db)


@router.post("/verify-email", response_model=TokenResponse)
def verify_email_endpoint(payload: VerifyEmailRequest, db: DatabaseDependency):
    """Verifica o email do usuario usando o token."""
    return verify_email(payload.token, db)


@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification(payload: ResendVerificationRequest, db: DatabaseDependency):
    """Reenvia o email de verificacao."""
    return resend_verification_email(payload.email, db)


@router.post("/change-password", response_model=MessageResponse)
def change_password_endpoint(
    payload: ChangePasswordRequest,
    current_user: CurrentUserDependency,
    db: DatabaseDependency,
):
    """Altera a senha do usuario autenticado."""
    return change_password(current_user, payload, db)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password_endpoint(payload: ForgotPasswordRequest, db: DatabaseDependency):
    """Envia email de recuperacao de senha."""
    return forgot_password(payload.email, db)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_endpoint(payload: ResetPasswordRequest, db: DatabaseDependency):
    """Redefine a senha usando o token de recuperacao."""
    return reset_password(payload.token, payload.new_password, db)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: CurrentUserDependency, db: DatabaseDependency):
    """Retorna o usuario autenticado com suas memberships."""
    return get_current_user_info(current_user, db)
