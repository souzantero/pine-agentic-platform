from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import OrganizationMember, RolePermission, User
from src.core.env import jwt_algorithm, jwt_expiration_hours, jwt_secret
from src.organization.schemas import OrganizationResponse

from .schemas import (
    LoginRequest,
    MembershipResponse,
    MembershipRoleResponse,
    MeResponse,
    RegisterRequest,
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


def register_user(payload: RegisterRequest, db: Session) -> TokenResponse:
    """Registra um novo usuario."""
    # Verifica se email ja existe
    statement = select(User).where(User.email == payload.email)
    existing_user = db.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ja cadastrado",
        )

    # Cria o usuario
    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Gera token
    access_token = create_access_token(str(user.id))
    return TokenResponse(access_token=access_token)


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
