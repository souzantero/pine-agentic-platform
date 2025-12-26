from langchain.agents import create_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres.base import BaseCheckpointSaver

from src.env import openrouter_api_key, openrouter_base_url

model = ChatOpenAI(
    model="google/gemini-2.5-flash-lite",
    temperature=0.1,
    openai_api_key=openrouter_api_key,
    openai_api_base=openrouter_base_url,
)

search = DuckDuckGoSearchRun()


def build_agent(checkpointer: BaseCheckpointSaver | None = None):
    return create_agent(
        model=model,
        system_prompt="Você é o Pinechat, um assistente virtual de inteligência artificial.",
        tools=[search],
        checkpointer=checkpointer,
    )


agent = build_agent()
