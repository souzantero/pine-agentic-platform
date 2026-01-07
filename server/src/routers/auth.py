from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.auth import CurrentUser, create_access_token, hash_password, verify_password
from src.database import get_session
from src.entities import OrganizationMember, User
from src.schemas import (
    LoginRequest,
    MembershipResponse,
    MeResponse,
    OrganizationResponse,
    RegisterRequest,
    RoleResponse,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: SessionDep):
    """Registra um novo usuario."""
    # Verifica se email ja existe
    statement = select(User).where(User.email == payload.email)
    existing_user = session.exec(statement).first()

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
    session.add(user)
    session.commit()
    session.refresh(user)

    # Gera token
    access_token = create_access_token(str(user.id))

    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: SessionDep):
    """Autentica um usuario e retorna o token JWT."""
    # Busca usuario pelo email
    statement = select(User).where(User.email == payload.email)
    user = session.exec(statement).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gera token
    access_token = create_access_token(str(user.id))

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: CurrentUser, session: SessionDep):
    """Retorna o usuario autenticado com suas memberships."""
    # Busca memberships do usuario com org e role
    statement = select(OrganizationMember).where(OrganizationMember.user_id == current_user.id)
    memberships = session.exec(statement).all()

    # Monta response com relacionamentos
    membership_responses = []
    for membership in memberships:
        # Carrega relacionamentos
        session.refresh(membership, ["organization", "role"])

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
                role=RoleResponse(
                    id=membership.role.id,
                    name=membership.role.name,
                    description=membership.role.description,
                ),
                is_owner=membership.is_owner,
            )
        )

    return MeResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            name=current_user.name,
            created_at=current_user.created_at,
        ),
        memberships=membership_responses,
    )
