import uuid
from dataclasses import dataclass
from datetime import datetime
from langchain.agents import create_agent
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres.base import BaseCheckpointSaver

from src.database import Database
from src.entities import Provider
from src.env import openrouter_base_url
from src.schemas import RunConfig
from src.agents.tools.web_search import create_web_search_tool


TEMPERATURE = 0.7

SYSTEM_PROMPT_TEMPLATE = """Você é um assistente de inteligência artificial prestativo, criativo e honesto.

## Informações da Sessão
- **Usuário:** {user_name}
- **Organização:** {organization_name}
- **Data atual:** {current_date}

## Diretrizes

### Comunicação
- Responda de forma clara, concisa e bem estruturada
- Adapte o tom e a complexidade da resposta ao contexto da conversa
- Use formatação markdown quando apropriado para melhorar a legibilidade
- Seja direto ao ponto, mas completo quando necessário

### Comportamento
- Seja útil e proativo em oferecer soluções
- Admita quando não souber algo ou quando houver incerteza
- Peça esclarecimentos quando a pergunta for ambígua
- Mantenha o contexto da conversa para respostas mais relevantes

### Conhecimento
- Forneça informações precisas e atualizadas
- Cite fontes quando relevante e disponível
- Diferencie claramente entre fatos e opiniões
- Seu conhecimento tem data de corte, então para informações muito recentes, considere usar ferramentas de busca se disponíveis

Você está aqui para ajudar {user_name} da organização {organization_name} com qualquer tarefa ou pergunta."""


@dynamic_prompt
def get_system_prompt(request: ModelRequest) -> str:
    ctx = request.runtime.context
    current_date = datetime.now().strftime("%d/%m/%Y")

    return SYSTEM_PROMPT_TEMPLATE.format(
        user_name=ctx.user_name,
        organization_name=ctx.organization_name,
        current_date=current_date,
    )

@dataclass
class AgentContext:
    organization_id: str
    organization_name: str
    user_id: str
    user_name: str

def get_model(
    provider: Provider,
    api_key: str,
    model: str,
):
    """Cria o modelo de LLM baseado no provedor."""
    if provider == Provider.OPENAI:
        return ChatOpenAI(
            model=model,
            temperature=TEMPERATURE,
            openai_api_key=api_key,
        )
    elif provider == Provider.OPENROUTER:
        return ChatOpenAI(
            model=model,
            temperature=TEMPERATURE,
            openai_api_key=api_key,
            openai_api_base=openrouter_base_url,
        )
    else:
        raise ValueError(f"Provedor {provider} nao suportado")

def build_agent(
    db: Database,
    organization_id: uuid.UUID,
    provider: Provider,
    api_key: str,
    config: RunConfig,
    checkpointer: BaseCheckpointSaver | None = None,
):
    """Constroi o agente com modelo e configuracoes especificas."""
    model = get_model(
        provider=provider,
        api_key=api_key,
        model=config.model,
    )

    # Cria ferramentas disponiveis para o agente
    tools = []

    web_search_tool = create_web_search_tool(db, organization_id)
    if web_search_tool:
        tools.append(web_search_tool)

    return create_agent(
        model=model,
        middleware=[get_system_prompt],
        tools=tools,
        checkpointer=checkpointer,
        context_schema=AgentContext
    )
