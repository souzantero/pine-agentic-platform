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


class RunPayload(CamelCaseModel):
    input: RunInput


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


class MembershipResponse(CamelCaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    organization: OrganizationResponse
    role: RoleResponse
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
    default_model_provider: str | None = None


class OrganizationDetailResponse(CamelCaseModel):
    id: uuid.UUID
    name: str
    slug: str
    default_model_provider: str | None
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
    organization: OrganizationResponse
    role: RoleResponse
    expires_at: datetime
    created_at: datetime


class InviteInfoResponse(CamelCaseModel):
    """Informacoes publicas do convite (para pagina de aceite)."""
    organization_name: str
    organization_slug: str
    role_name: str
    expires_at: datetime
    is_expired: bool
    is_used: bool


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
    default_provider: str | None
    providers: List[ModelProviderResponse]


class SetDefaultProviderRequest(CamelCaseModel):
    default_provider: str | None


# =============================================================================
# Models Schemas
# =============================================================================


class ModelInfo(CamelCaseModel):
    id: str
    name: str
    description: str | None = None


class ModelsResponse(CamelCaseModel):
    default_provider: str | None
    selected_provider: str | None
    models: List[ModelInfo]
    configured_providers: List[str]
