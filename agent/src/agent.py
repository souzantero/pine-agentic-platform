from langchain.agents import create_agent
from langchain.chat_models import init_chat_model

model = init_chat_model("openai:gpt-5", temperature=0.1)

agent = create_agent(
    model=model,
    system_prompt="Você é o Pinechat, um assistente virtual de inteligência artificial.",
)
