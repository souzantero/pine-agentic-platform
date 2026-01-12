import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session, select

from src.auth import CurrentUser, check_permission
from src.database import DatabaseSession
from src.entities import Permission, Role, RolePermission, RoleScope
from src.schemas import CreateRoleRequest, RoleDetailResponse, UpdateRoleRequest

router = APIRouter(prefix="/organizations/{organization_id}/roles", tags=["roles"])


def get_role_permissions(db: Session, role_id: uuid.UUID) -> List[str]:
    """Retorna lista de permissoes de uma role."""
    statement = select(RolePermission).where(RolePermission.role_id == role_id)
    role_permissions = db.exec(statement).all()
    return [rp.permission.value for rp in role_permissions]


def validate_permissions(permissions: List[str]) -> List[Permission]:
    """Valida e converte lista de strings para Permission enum."""
    valid_permissions = []
    for perm_str in permissions:
        try:
            valid_permissions.append(Permission(perm_str))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Permissao invalida: {perm_str}. Valores aceitos: {[p.value for p in Permission]}",
            )
    return valid_permissions


@router.get("", response_model=List[RoleDetailResponse])
def list_roles(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Lista todas as roles da organizacao (requer ROLES_READ)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_READ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_READ necessaria",
        )

    # Busca roles da organizacao
    statement = select(Role).where(Role.organization_id == organization_id)
    roles = db.exec(statement).all()

    # Monta response com permissoes
    result = []
    for role in roles:
        permissions = get_role_permissions(db, role.id)
        result.append(
            RoleDetailResponse(
                id=role.id,
                name=role.name,
                description=role.description,
                is_system_role=role.is_system_role,
                permissions=permissions,
                created_at=role.created_at,
            )
        )

    return result


@router.post("", response_model=RoleDetailResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    organization_id: uuid.UUID,
    payload: CreateRoleRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Cria uma nova role na organizacao (requer ROLES_MANAGE)."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )

    # Valida permissoes
    valid_permissions = validate_permissions(payload.permissions)

    # Verifica se ja existe role com mesmo nome
    statement = select(Role).where(
        Role.organization_id == organization_id,
        Role.name == payload.name,
    )
    existing = db.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ja existe uma role com este nome",
        )

    # Cria a role
    role = Role(
        organization_id=organization_id,
        scope=RoleScope.ORGANIZATION,
        name=payload.name,
        description=payload.description,
        is_system_role=False,
    )
    db.add(role)
    db.flush()

    # Adiciona permissoes
    for permission in valid_permissions:
        role_permission = RolePermission(
            role_id=role.id,
            permission=permission,
        )
        db.add(role_permission)

    db.commit()
    db.refresh(role)

    return RoleDetailResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system_role=role.is_system_role,
        permissions=[p.value for p in valid_permissions],
        created_at=role.created_at,
    )


@router.put("/{role_id}", response_model=RoleDetailResponse)
def update_role(
    organization_id: uuid.UUID,
    role_id: uuid.UUID,
    payload: UpdateRoleRequest,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Atualiza uma role (requer ROLES_MANAGE). Nao permite editar system roles."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )

    # Busca a role
    role = db.get(Role, role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role nao encontrada",
        )

    # Nao permite editar system roles
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel editar roles do sistema",
        )

    # Atualiza campos
    if payload.name is not None:
        # Verifica duplicidade
        statement = select(Role).where(
            Role.organization_id == organization_id,
            Role.name == payload.name,
            Role.id != role_id,
        )
        existing = db.exec(statement).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ja existe uma role com este nome",
            )
        role.name = payload.name

    if payload.description is not None:
        role.description = payload.description

    # Atualiza permissoes se fornecidas
    if payload.permissions is not None:
        valid_permissions = validate_permissions(payload.permissions)

        # Remove permissoes antigas
        statement = select(RolePermission).where(RolePermission.role_id == role_id)
        old_permissions = db.exec(statement).all()
        for old_perm in old_permissions:
            db.delete(old_perm)

        # Adiciona novas permissoes
        for permission in valid_permissions:
            role_permission = RolePermission(
                role_id=role.id,
                permission=permission,
            )
            db.add(role_permission)

    db.add(role)
    db.commit()
    db.refresh(role)

    permissions = get_role_permissions(db, role.id)

    return RoleDetailResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system_role=role.is_system_role,
        permissions=permissions,
        created_at=role.created_at,
    )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    organization_id: uuid.UUID,
    role_id: uuid.UUID,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    """Deleta uma role (requer ROLES_MANAGE). Nao permite deletar system roles."""
    # Verifica permissao
    if not check_permission(db, current_user.id, organization_id, Permission.ROLES_MANAGE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissao ROLES_MANAGE necessaria",
        )

    # Busca a role
    role = db.get(Role, role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role nao encontrada",
        )

    # Nao permite deletar system roles
    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel deletar roles do sistema",
        )

    # Verifica se ha membros usando esta role
    from src.entities import OrganizationMember
    statement = select(OrganizationMember).where(OrganizationMember.role_id == role_id)
    members_using = db.exec(statement).first()
    if members_using:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel deletar role que esta sendo usada por membros",
        )

    # Remove permissoes primeiro (cascade manual)
    statement = select(RolePermission).where(RolePermission.role_id == role_id)
    role_permissions = db.exec(statement).all()
    for rp in role_permissions:
        db.delete(rp)

    # Remove a role
    db.delete(role)
    db.commit()
