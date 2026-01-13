import uuid
from datetime import datetime
from typing import List

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, ConfigDict, EmailStr


def to_camel(string: str) -> str:
    """Converte snake_case para camelCase."""
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    """Base model que serializa campos em camelCase."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )


# =============================================================================
# Agent Schemas
# =============================================================================


class MessageInput(CamelCaseModel):
    content: str

    def to_agent(self):
        return HumanMessage(content=self.content)


class RunInput(CamelCaseModel):
    messages: List[MessageInput]


class RunConfig(CamelCaseModel):
    """Configuracao de execucao do agente."""

    provider: str  # OPENAI, OPENROUTER
    model: str
    temperature: float = 0.7
    system_prompt_id: uuid.UUID | None = None


class RunRequest(CamelCaseModel):
    input: RunInput
    config: RunConfig


# =============================================================================
# Auth Schemas
# =============================================================================


class RegisterRequest(CamelCaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(CamelCaseModel):
    email: EmailStr
    password: str


class TokenResponse(CamelCaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(CamelCaseModel):
    id: uuid.UUID
    email: str
    name: str
    created_at: datetime


class OrganizationResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime


class RoleResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    description: str | None


class MembershipRoleResponse(CamelCaseModel):
    """Role com permissoes para uso no membership."""
    id: uuid.UUID
    name: str
    description: str | None
    scope: str
    is_system_role: bool
    permissions: List[str]


class MembershipResponse(CamelCaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    organization: OrganizationResponse
    role: MembershipRoleResponse
    is_owner: bool


class MeResponse(CamelCaseModel):
    user: UserResponse
    memberships: List[MembershipResponse]


# =============================================================================
# Organization Schemas
# =============================================================================


class CreateOrganizationRequest(CamelCaseModel):
    name: str
    slug: str


class UpdateOrganizationRequest(CamelCaseModel):
    name: str | None = None
    slug: str | None = None


class OrganizationDetailResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Member Schemas
# =============================================================================


class MemberUserResponse(CamelCaseModel):
    id: uuid.UUID
    email: str
    name: str


class MemberDetailResponse(CamelCaseModel):
    id: uuid.UUID
    user: MemberUserResponse
    role: RoleResponse
    is_owner: bool
    created_at: datetime


class UpdateMemberRoleRequest(CamelCaseModel):
    role_id: uuid.UUID


# =============================================================================
# Invite Schemas
# =============================================================================


class CreateInviteRequest(CamelCaseModel):
    role_id: uuid.UUID
    expires_in_days: int = 7


class InviteResponse(CamelCaseModel):
    id: uuid.UUID
    token: str
    invite_link: str
    organization: OrganizationResponse
    role: RoleResponse
    expires_at: datetime
    created_at: datetime


class InviteInfoOrganization(CamelCaseModel):
    """Organizacao do convite (info publica)."""
    name: str
    slug: str


class InviteInfoRole(CamelCaseModel):
    """Role do convite (info publica)."""
    name: str


class InviteInfoCreatedBy(CamelCaseModel):
    """Usuario que criou o convite (info publica)."""
    name: str


class InviteInfoResponse(CamelCaseModel):
    """Informacoes publicas do convite (para pagina de aceite)."""
    organization: InviteInfoOrganization
    role: InviteInfoRole
    created_by: InviteInfoCreatedBy
    expires_at: datetime
    is_expired: bool
    is_used: bool


class InviteCreatedByResponse(CamelCaseModel):
    """Informacoes do usuario que criou o convite."""
    id: uuid.UUID
    name: str
    email: str


class InviteListItemResponse(CamelCaseModel):
    """Item da listagem de convites pendentes."""
    id: uuid.UUID
    token: str
    invite_link: str
    role: RoleResponse
    created_by: InviteCreatedByResponse
    expires_at: datetime
    created_at: datetime


# =============================================================================
# Role Schemas
# =============================================================================


class CreateRoleRequest(CamelCaseModel):
    name: str
    description: str | None = None
    permissions: List[str]


class UpdateRoleRequest(CamelCaseModel):
    name: str | None = None
    description: str | None = None
    permissions: List[str] | None = None


class RoleDetailResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_system_role: bool
    permissions: List[str]
    created_at: datetime


# =============================================================================
# Thread Schemas
# =============================================================================


class CreateThreadRequest(CamelCaseModel):
    title: str | None = None


class UpdateThreadRequest(CamelCaseModel):
    title: str | None = None


class ThreadResponse(CamelCaseModel):
    id: uuid.UUID
    title: str | None
    last_message_at: datetime | None
    last_message_preview: str | None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Prompt Schemas
# =============================================================================


class CreatePromptRequest(CamelCaseModel):
    name: str
    content: str
    role: str = "SYSTEM"  # SYSTEM, USER, ASSISTANT


class UpdatePromptRequest(CamelCaseModel):
    name: str | None = None
    content: str | None = None
    role: str | None = None


class PromptResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    content: str
    role: str
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Model Provider Schemas
# =============================================================================


class CreateModelProviderRequest(CamelCaseModel):
    provider: str
    api_key: str


class ModelProviderResponse(CamelCaseModel):
    id: uuid.UUID
    provider: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ModelProvidersListResponse(CamelCaseModel):
    providers: List[ModelProviderResponse]


# =============================================================================
# Models Schemas
# =============================================================================


class ModelInfo(CamelCaseModel):
    id: str
    name: str
    description: str | None = None


class ModelsResponse(CamelCaseModel):
    models: List[ModelInfo]
    configured_providers: List[str]
