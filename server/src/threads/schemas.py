import uuid
from datetime import datetime
from typing import List

from langchain_core.messages import HumanMessage

from src.core.schemas import CamelCaseModel


# =============================================================================
# Agent/Run Schemas
# =============================================================================


class MessageInput(CamelCaseModel):
    content: str

    def to_agent(self):
        return HumanMessage(content=self.content)


class RunInput(CamelCaseModel):
    messages: List[MessageInput]


class RunConfig(CamelCaseModel):
    """Configuracao de execucao."""

    provider: str  # OPENAI, OPENROUTER
    model: str


class RunRequest(CamelCaseModel):
    input: RunInput
    config: RunConfig


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


class AgentMessageResponse(CamelCaseModel):
    """Mensagem do agente serializada em camelCase."""
    id: str | None = None
    type: str | None = None
    content: str | None = None
    response_metadata: dict | None = None
    tool_calls: List[dict] | None = None
    additional_kwargs: dict | None = None
    created_at: str | None = None


class ThreadMessagesResponse(CamelCaseModel):
    """Resposta com lista de mensagens da thread."""
    messages: List[AgentMessageResponse]
