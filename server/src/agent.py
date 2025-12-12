from langchain.agents import create_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres.base import BaseCheckpointSaver

model = ChatOpenAI(
    model="gpt-5",
    stream_usage=True,
    temperature=0.1,
    reasoning_effort="low",
    max_retries=3,
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
