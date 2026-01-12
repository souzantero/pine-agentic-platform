from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from src.auth import CurrentUser, create_access_token, hash_password, verify_password
from src.database import DatabaseSession
from src.entities import OrganizationMember, RolePermission, User
from src.schemas import (
    LoginRequest,
    MembershipResponse,
    MembershipRoleResponse,
    MeResponse,
    OrganizationResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DatabaseSession):
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


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DatabaseSession):
    """Autentica um usuario e retorna o token JWT."""
    # Busca usuario pelo email
    statement = select(User).where(User.email == payload.email)
    user = db.exec(statement).first()

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
def get_me(current_user: CurrentUser, db: DatabaseSession):
    """Retorna o usuario autenticado com suas memberships."""
    # Busca memberships do usuario com org e role
    statement = select(OrganizationMember).where(OrganizationMember.user_id == current_user.id)
    memberships = db.exec(statement).all()

    # Monta response com relacionamentos
    membership_responses = []
    for membership in memberships:
        # Carrega relacionamentos
        db.refresh(membership, ["organization", "role"])

        # Busca permissoes da role
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
            id=current_user.id,
            email=current_user.email,
            name=current_user.name,
            created_at=current_user.created_at,
        ),
        memberships=membership_responses,
    )
