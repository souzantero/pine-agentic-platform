from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    max_tokens=None,
    timeout=None,
    max_retries=3,
)

agent = create_agent(
    model=model,
    system_prompt="Você é o Pinechat, um assistente virtual de inteligência artificial.",
)
