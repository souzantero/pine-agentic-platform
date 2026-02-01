import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.core.email import send_verification_email
from src.core.env import (
    email_verification_rate_limit_seconds,
    email_verification_token_expiration_hours,
    jwt_algorithm,
    jwt_expiration_hours,
    jwt_secret,
)
from src.database.entities import OrganizationMember, RolePermission, User
from src.organization.schemas import OrganizationResponse

from .schemas import (
    LoginRequest,
    MembershipResponse,
    MembershipRoleResponse,
    MeResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationResponse,
    TokenResponse,
    UserResponse,
)


def hash_password(password: str) -> str:
    """Gera hash bcrypt da senha."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash."""
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def generate_verification_token() -> str:
    """Gera token de verificacao seguro."""
    return secrets.token_urlsafe(32)


def get_token_expiration() -> datetime:
    """Retorna datetime de expiracao do token de verificacao."""
    return datetime.now(UTC) + timedelta(hours=email_verification_token_expiration_hours)


def create_access_token(user_id: str, expires_delta: timedelta | None = None) -> str:
    """Cria JWT token para o usuario."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(hours=jwt_expiration_hours)

    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(to_encode, jwt_secret, algorithm=jwt_algorithm)


def register_user(payload: RegisterRequest, db: Session) -> RegisterResponse:
    """Registra um novo usuario e envia email de verificacao."""
    # Verifica se email ja existe
    statement = select(User).where(User.email == payload.email)
    existing_user = db.exec(statement).first()

    if existing_user:
        # Se usuario existe mas nao verificou, informar para verificar
        if not existing_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email ja cadastrado. Verifique sua caixa de entrada ou solicite reenvio.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ja cadastrado",
        )

    # Gerar token de verificacao
    verification_token = generate_verification_token()
    token_expires_at = get_token_expiration()

    # Cria o usuario (nao verificado)
    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_token_expires_at=token_expires_at,
        last_verification_email_sent_at=datetime.now(UTC),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Enviar email de verificacao
    send_verification_email(payload.email, payload.name, verification_token)

    return RegisterResponse(
        message="Conta criada! Verifique seu email para ativar.",
        email=payload.email,
    )


def login_user(payload: LoginRequest, db: Session) -> TokenResponse:
    """Autentica um usuario e retorna o token JWT."""
    statement = select(User).where(User.email == payload.email)
    user = db.exec(statement).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar se email foi confirmado
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email nao verificado. Verifique sua caixa de entrada.",
        )

    access_token = create_access_token(str(user.id))
    return TokenResponse(access_token=access_token)


def get_current_user_info(user: User, db: Session) -> MeResponse:
    """Retorna o usuario autenticado com suas memberships."""
    statement = select(OrganizationMember).where(OrganizationMember.user_id == user.id)
    memberships = db.exec(statement).all()

    membership_responses = []
    for membership in memberships:
        db.refresh(membership, ["organization", "role"])

        perm_statement = select(RolePermission).where(RolePermission.role_id == membership.role.id)
        role_permissions = db.exec(perm_statement).all()
        permissions = [rp.permission.value for rp in role_permissions]

        membership_responses.append(
            MembershipResponse(
                id=membership.id,
                organization_id=membership.organization_id,
                organization=OrganizationResponse(
                    id=membership.organization.id,
                    name=membership.organization.name,
                    slug=membership.organization.slug,
                    created_at=membership.organization.created_at,
                ),
                role=MembershipRoleResponse(
                    id=membership.role.id,
                    name=membership.role.name,
                    description=membership.role.description,
                    scope=membership.role.scope.value,
                    is_system_role=membership.role.is_system_role,
                    permissions=permissions,
                ),
                is_owner=membership.is_owner,
            )
        )

    return MeResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
        ),
        memberships=membership_responses,
    )


def verify_email(token: str, db: Session) -> TokenResponse:
    """Verifica o email do usuario e retorna JWT."""
    statement = select(User).where(User.email_verification_token == token)
    user = db.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificacao invalido",
        )

    # Verificar se token expirou
    now = datetime.now(UTC)
    expires_at = user.email_verification_token_expires_at
    if expires_at:
        # Garantir timezone aware
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)

        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de verificacao expirado. Solicite um novo.",
            )

    # Marcar email como verificado
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires_at = None
    db.add(user)
    db.commit()

    # Retornar JWT (usuario pode continuar logado)
    access_token = create_access_token(str(user.id))
    return TokenResponse(access_token=access_token)


def resend_verification_email(email: str, db: Session) -> ResendVerificationResponse:
    """Reenvia email de verificacao com rate limiting."""
    statement = select(User).where(User.email == email)
    user = db.exec(statement).first()

    # Nao revelar se email existe (seguranca)
    generic_message = "Se este email estiver cadastrado, enviaremos um link de verificacao."

    if not user:
        return ResendVerificationResponse(message=generic_message)

    # Se ja verificado, retornar mensagem generica
    if user.email_verified:
        return ResendVerificationResponse(message=generic_message)

    # Verificar rate limit
    now = datetime.now(UTC)
    if user.last_verification_email_sent_at:
        last_sent = user.last_verification_email_sent_at
        # Garantir timezone aware
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=UTC)

        seconds_since_last = (now - last_sent).total_seconds()
        if seconds_since_last < email_verification_rate_limit_seconds:
            remaining = int(email_verification_rate_limit_seconds - seconds_since_last)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Aguarde {remaining} segundos antes de reenviar.",
            )

    # Gerar novo token
    verification_token = generate_verification_token()
    user.email_verification_token = verification_token
    user.email_verification_token_expires_at = get_token_expiration()
    user.last_verification_email_sent_at = now
    db.add(user)
    db.commit()

    # Enviar email
    send_verification_email(user.email, user.name, verification_token)

    return ResendVerificationResponse(message=generic_message)
