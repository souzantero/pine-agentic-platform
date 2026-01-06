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
