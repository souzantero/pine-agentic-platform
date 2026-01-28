import uuid
from typing import List

from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.database.entities import OrganizationMember, Permission, Role, RolePermission, RoleScope

from .schemas import RoleDetailResponse


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


def list_roles(organization_id: uuid.UUID, db: Session) -> List[RoleDetailResponse]:
    """Lista todas as roles da organizacao."""
    statement = select(Role).where(Role.organization_id == organization_id)
    roles = db.exec(statement).all()

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


def create_role(
    organization_id: uuid.UUID, name: str, description: str | None, permissions: List[str], db: Session
) -> RoleDetailResponse:
    """Cria uma nova role na organizacao."""
    valid_permissions = validate_permissions(permissions)

    # Verifica se ja existe role com mesmo nome
    statement = select(Role).where(
        Role.organization_id == organization_id,
        Role.name == name,
    )
    existing = db.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ja existe uma role com este nome",
        )

    role = Role(
        organization_id=organization_id,
        scope=RoleScope.ORGANIZATION,
        name=name,
        description=description,
        is_system_role=False,
    )
    db.add(role)
    db.flush()

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


def update_role(
    organization_id: uuid.UUID, role_id: uuid.UUID, name: str | None, description: str | None,
    permissions: List[str] | None, db: Session
) -> RoleDetailResponse:
    """Atualiza uma role. Nao permite editar system roles."""
    role = db.get(Role, role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role nao encontrada",
        )

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel editar roles do sistema",
        )

    if name is not None:
        statement = select(Role).where(
            Role.organization_id == organization_id,
            Role.name == name,
            Role.id != role_id,
        )
        existing = db.exec(statement).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ja existe uma role com este nome",
            )
        role.name = name

    if description is not None:
        role.description = description

    if permissions is not None:
        valid_permissions = validate_permissions(permissions)

        statement = select(RolePermission).where(RolePermission.role_id == role_id)
        old_permissions = db.exec(statement).all()
        for old_perm in old_permissions:
            db.delete(old_perm)

        for permission in valid_permissions:
            role_permission = RolePermission(
                role_id=role.id,
                permission=permission,
            )
            db.add(role_permission)

    db.add(role)
    db.commit()
    db.refresh(role)

    role_perms = get_role_permissions(db, role.id)

    return RoleDetailResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system_role=role.is_system_role,
        permissions=role_perms,
        created_at=role.created_at,
    )


def delete_role(organization_id: uuid.UUID, role_id: uuid.UUID, db: Session) -> None:
    """Deleta uma role. Nao permite deletar system roles."""
    role = db.get(Role, role_id)
    if not role or role.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role nao encontrada",
        )

    if role.is_system_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel deletar roles do sistema",
        )

    statement = select(OrganizationMember).where(OrganizationMember.role_id == role_id)
    members_using = db.exec(statement).first()
    if members_using:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nao e possivel deletar role que esta sendo usada por membros",
        )

    statement = select(RolePermission).where(RolePermission.role_id == role_id)
    role_permissions = db.exec(statement).all()
    for rp in role_permissions:
        db.delete(rp)

    db.delete(role)
    db.commit()
