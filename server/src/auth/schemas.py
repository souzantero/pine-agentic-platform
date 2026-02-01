import uuid
from datetime import datetime
from typing import List

from pydantic import EmailStr

from src.core.schemas import CamelCaseModel
from src.organization.schemas import OrganizationResponse


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
# Email Verification Schemas
# =============================================================================


class RegisterResponse(CamelCaseModel):
    """Resposta do registro (sem token, requer verificacao)"""

    message: str
    email: str


class VerifyEmailRequest(CamelCaseModel):
    """Request para verificar email"""

    token: str


class ResendVerificationRequest(CamelCaseModel):
    """Request para reenviar email de verificacao"""

    email: EmailStr


class ResendVerificationResponse(CamelCaseModel):
    """Resposta do reenvio de verificacao"""

    message: str

