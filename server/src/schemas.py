from typing import List
from pydantic import BaseModel
from langchain_core.messages import (
    HumanMessage,
)


class MessageInput(BaseModel):
    content: str

    def to_agent(self):
        return HumanMessage(content=self.content)


class RunInput(BaseModel):
    messages: List[MessageInput]


class RunPayload(BaseModel):
    input: RunInput
