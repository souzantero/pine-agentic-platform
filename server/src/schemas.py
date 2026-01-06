import uuid
from datetime import datetime
from typing import List

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, EmailStr


# =============================================================================
# Agent Schemas
# =============================================================================


class MessageInput(BaseModel):
    content: str

    def to_agent(self):
        return HumanMessage(content=self.content)


class RunInput(BaseModel):
    messages: List[MessageInput]


class RunPayload(BaseModel):
    input: RunInput


# =============================================================================
# Auth Schemas
# =============================================================================


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None

    class Config:
        from_attributes = True


class MembershipResponse(BaseModel):
    id: uuid.UUID
    organization: OrganizationResponse
    role: RoleResponse
    is_owner: bool

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    user: UserResponse
    memberships: List[MembershipResponse]


# =============================================================================
# Organization Schemas
# =============================================================================


class CreateOrganizationRequest(BaseModel):
    name: str
    slug: str


class UpdateOrganizationRequest(BaseModel):
    name: str | None = None
    slug: str | None = None
    default_model_provider: str | None = None


class OrganizationDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    default_model_provider: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Member Schemas
# =============================================================================


class MemberUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str

    class Config:
        from_attributes = True


class MemberDetailResponse(BaseModel):
    id: uuid.UUID
    user: MemberUserResponse
    role: RoleResponse
    is_owner: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateMemberRoleRequest(BaseModel):
    role_id: uuid.UUID


# =============================================================================
# Invite Schemas
# =============================================================================


class CreateInviteRequest(BaseModel):
    role_id: uuid.UUID
    expires_in_days: int = 7


class InviteResponse(BaseModel):
    id: uuid.UUID
    token: str
    organization: OrganizationResponse
    role: RoleResponse
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class InviteInfoResponse(BaseModel):
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


class CreateRoleRequest(BaseModel):
    name: str
    description: str | None = None
    permissions: List[str]


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: List[str] | None = None


class RoleDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_system_role: bool
    permissions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Thread Schemas
# =============================================================================


class CreateThreadRequest(BaseModel):
    title: str | None = None


class UpdateThreadRequest(BaseModel):
    title: str | None = None


class ThreadResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Prompt Schemas
# =============================================================================


class CreatePromptRequest(BaseModel):
    name: str
    content: str
    role: str = "SYSTEM"  # SYSTEM, USER, ASSISTANT


class UpdatePromptRequest(BaseModel):
    name: str | None = None
    content: str | None = None
    role: str | None = None


class PromptResponse(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    role: str
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Model Provider Schemas
# =============================================================================


class CreateModelProviderRequest(BaseModel):
    provider: str
    api_key: str


class ModelProviderResponse(BaseModel):
    id: uuid.UUID
    provider: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModelProvidersListResponse(BaseModel):
    default_provider: str | None
    providers: List[ModelProviderResponse]


class SetDefaultProviderRequest(BaseModel):
    default_provider: str | None


# =============================================================================
# Models Schemas
# =============================================================================


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str | None = None


class ModelsResponse(BaseModel):
    default_provider: str | None
    selected_provider: str | None
    models: List[ModelInfo]
    configured_providers: List[str]
