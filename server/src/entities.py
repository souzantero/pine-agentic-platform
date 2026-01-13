import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel, Text


def get_now():
    return datetime.now(UTC)


# =============================================================================
# ENUMS
# =============================================================================


class RoleScope(str, Enum):
    """Escopo da role (plataforma ou organizacao)"""

    PLATFORM = "PLATFORM"  # Role global da plataforma (organizationId = null)
    ORGANIZATION = "ORGANIZATION"  # Role especifica de uma organizacao


class Permission(str, Enum):
    """Permissoes do sistema (fixas)"""

    # Threads
    THREADS_READ = "THREADS_READ"
    THREADS_WRITE = "THREADS_WRITE"
    THREADS_DELETE = "THREADS_DELETE"
    # Agentes
    AGENTS_READ = "AGENTS_READ"
    AGENTS_WRITE = "AGENTS_WRITE"
    AGENTS_DELETE = "AGENTS_DELETE"
    # Membros
    MEMBERS_READ = "MEMBERS_READ"
    MEMBERS_INVITE = "MEMBERS_INVITE"
    MEMBERS_MANAGE = "MEMBERS_MANAGE"
    # Roles
    ROLES_READ = "ROLES_READ"
    ROLES_MANAGE = "ROLES_MANAGE"
    # Organizacao
    ORGANIZATION_MANAGE = "ORGANIZATION_MANAGE"
    # Plataforma (para roles de plataforma no futuro)
    PLATFORM_MANAGE = "PLATFORM_MANAGE"
    # Prompts
    PROMPTS_READ = "PROMPTS_READ"
    PROMPTS_WRITE = "PROMPTS_WRITE"
    PROMPTS_DELETE = "PROMPTS_DELETE"


class PromptRole(str, Enum):
    """Role do prompt (para IA)"""

    SYSTEM = "SYSTEM"
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class ModelProvider(str, Enum):
    """Provedor de modelos de IA"""

    OPENAI = "OPENAI"
    OPENROUTER = "OPENROUTER"
    ANTHROPIC = "ANTHROPIC"
    GOOGLE = "GOOGLE"


# =============================================================================
# MODELS
# =============================================================================


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    memberships: list["OrganizationMember"] = Relationship(back_populates="user")
    invites_created: list["OrganizationInvite"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={"foreign_keys": "[OrganizationInvite.created_by_id]"},
    )
    invites_accepted: list["OrganizationInvite"] = Relationship(
        back_populates="used_by",
        sa_relationship_kwargs={"foreign_keys": "[OrganizationInvite.used_by_id]"},
    )


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    members: list["OrganizationMember"] = Relationship(back_populates="organization")
    roles: list["Role"] = Relationship(back_populates="organization")
    invites: list["OrganizationInvite"] = Relationship(back_populates="organization")
    threads: list["Thread"] = Relationship(back_populates="organization")
    prompts: list["Prompt"] = Relationship(back_populates="organization")
    model_providers: list["OrganizationModelProvider"] = Relationship(back_populates="organization")


class OrganizationModelProvider(SQLModel, table=True):
    """Configuracoes de provedores de modelos por organizacao"""

    __tablename__ = "organization_model_providers"
    __table_args__ = (UniqueConstraint("organization_id", "provider"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    provider: ModelProvider
    api_key: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    organization: Organization = Relationship(back_populates="model_providers")


class Role(SQLModel, table=True):
    """Roles unificadas (plataforma e organizacao)"""

    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("organization_id", "name"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID | None = Field(
        default=None, foreign_key="organizations.id", index=True
    )  # null = role de plataforma
    scope: RoleScope = Field(default=RoleScope.ORGANIZATION)
    name: str
    description: str | None = None
    is_system_role: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    organization: Organization | None = Relationship(back_populates="roles")
    permissions: list["RolePermission"] = Relationship(back_populates="role")
    members: list["OrganizationMember"] = Relationship(back_populates="role")
    invites: list["OrganizationInvite"] = Relationship(back_populates="role")


class RolePermission(SQLModel, table=True):
    """Permissoes atribuidas a cada role"""

    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role_id: uuid.UUID = Field(foreign_key="roles.id", index=True)
    permission: Permission
    created_at: datetime = Field(default_factory=get_now)

    # Relationships
    role: Role = Relationship(back_populates="permissions")


class OrganizationMember(SQLModel, table=True):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("user_id", "organization_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    role_id: uuid.UUID = Field(foreign_key="roles.id", index=True)
    is_owner: bool = Field(default=False)
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    user: User = Relationship(back_populates="memberships")
    organization: Organization = Relationship(back_populates="members")
    role: Role = Relationship(back_populates="members")
    threads: list["Thread"] = Relationship(back_populates="created_by")
    prompts: list["Prompt"] = Relationship(back_populates="created_by")


class Thread(SQLModel, table=True):
    """Threads de conversa"""

    __tablename__ = "threads"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    created_by_id: uuid.UUID = Field(foreign_key="organization_members.id", index=True)
    title: str | None = None
    last_message_at: datetime | None = Field(default=None, index=True)
    last_message_preview: str | None = None
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    organization: Organization = Relationship(back_populates="threads")
    created_by: OrganizationMember = Relationship(back_populates="threads")


class Prompt(SQLModel, table=True):
    """Prompts salvos"""

    __tablename__ = "prompts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    created_by_id: uuid.UUID = Field(foreign_key="organization_members.id", index=True)
    name: str
    content: str = Field(sa_type=Text)
    role: PromptRole = Field(default=PromptRole.SYSTEM)
    created_at: datetime = Field(default_factory=get_now)
    updated_at: datetime = Field(default_factory=get_now, sa_column_kwargs={"onupdate": get_now})

    # Relationships
    organization: Organization = Relationship(back_populates="prompts")
    created_by: OrganizationMember = Relationship(back_populates="prompts")


class OrganizationInvite(SQLModel, table=True):
    """Convites para organizacao"""

    __tablename__ = "organization_invites"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    organization_id: uuid.UUID = Field(foreign_key="organizations.id", index=True)
    role_id: uuid.UUID = Field(foreign_key="roles.id", index=True)
    token: str = Field(unique=True, index=True)
    created_by_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    expires_at: datetime
    used_at: datetime | None = None
    used_by_id: uuid.UUID | None = Field(default=None, foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=get_now)

    # Relationships
    organization: Organization = Relationship(back_populates="invites")
    role: Role = Relationship(back_populates="invites")
    created_by: User = Relationship(
        back_populates="invites_created",
        sa_relationship_kwargs={"foreign_keys": "[OrganizationInvite.created_by_id]"},
    )
    used_by: User | None = Relationship(
        back_populates="invites_accepted",
        sa_relationship_kwargs={"foreign_keys": "[OrganizationInvite.used_by_id]"},
    )
