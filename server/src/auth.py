import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from src.database import DatabaseSession
from src.entities import Organization, OrganizationMember, Permission, RolePermission, User
from src.env import jwt_algorithm, jwt_expiration_hours, jwt_secret

# Bearer token scheme
bearer_scheme = HTTPBearer()


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


def decode_token(token: str) -> dict | None:
    """Decodifica e valida JWT token."""
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
        return payload
    except jwt.PyJWTError:
        return None

# Dependency para obter o usuario atual
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: DatabaseSession,
) -> User:
    """Dependency que retorna o usuario autenticado ou 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.get(User, uuid.UUID(user_id))
    if user is None:
        raise credentials_exception

    return user


# Type alias para usar como dependency
CurrentUser = Annotated[User, Depends(get_current_user)]


def get_user_permissions(db: Session, user_id: uuid.UUID, organization_id: uuid.UUID) -> set[Permission]:
    """Retorna o conjunto de permissoes do usuario na organizacao."""
    # Busca o membership do usuario na organizacao
    member_statement = select(OrganizationMember).where(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id,
    )
    member = db.exec(member_statement).first()

    if not member:
        return set()

    # Busca as permissoes da role do membro
    permissions_statement = select(RolePermission).where(RolePermission.role_id == member.role_id)
    role_permissions = db.exec(permissions_statement).all()

    return {rp.permission for rp in role_permissions}


def check_permission(
    db: Session,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    required_permission: Permission,
) -> bool:
    """Verifica se o usuario tem a permissao na organizacao."""
    permissions = get_user_permissions(db, user_id, organization_id)
    return required_permission in permissions


def require_permission(required_permission: Permission):
    """
    Factory de dependency que verifica se o usuario tem a permissao.
    Uso: Depends(require_permission(Permission.THREADS_WRITE))
    """

    async def permission_checker(
        current_user: CurrentUser,
        db: DatabaseSession,
        organization_id: uuid.UUID,
    ) -> User:
        if not check_permission(db, current_user.id, organization_id, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissao {required_permission.value} necessaria",
            )
        return current_user

    return permission_checker


def get_user_membership(
    db: Session, user_id: uuid.UUID, organization_id: uuid.UUID
) -> OrganizationMember | None:
    """Retorna o membership do usuario na organizacao."""
    statement = select(OrganizationMember).where(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id,
    )
    return db.exec(statement).first()


def get_organization_by_id(db: Session, organization_id: uuid.UUID) -> Organization | None:
    """Retorna a organizacao pelo ID."""
    return db.get(Organization, organization_id)
