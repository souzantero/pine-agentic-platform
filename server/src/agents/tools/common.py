"""Funcoes e classes compartilhadas entre ferramentas do agente."""

import asyncio
import logging
import uuid

from datetime import datetime
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI
from sqlmodel import select

from src.entities import (
    OrganizationProvider,
    ProviderType,
    Provider,
)
from src.database import Database
from src.env import openrouter_base_url


# Prompt para sumarizacao de paginas web
SUMMARIZE_WEBPAGE_PROMPT = """Voce deve resumir o conteudo bruto de uma pagina web. Seu objetivo e criar um resumo que preserve as informacoes mais importantes da pagina original.

Aqui esta o conteudo bruto da pagina:

<webpage_content>
{webpage_content}
</webpage_content>

Siga estas diretrizes para criar seu resumo:

1. Identifique e preserve o topico principal ou proposito da pagina.
2. Mantenha fatos, estatisticas e dados que sao centrais para a mensagem do conteudo.
3. Preserve citacoes importantes de fontes credíveis ou especialistas.
4. Mantenha a ordem cronologica dos eventos se o conteudo for sensivel ao tempo ou historico.
5. Preserve listas ou instrucoes passo a passo se presentes.
6. Inclua datas, nomes e locais relevantes que sao cruciais para entender o conteudo.
7. Resuma explicacoes longas mantendo a mensagem central intacta.

Ao lidar com diferentes tipos de conteudo:

- Para noticias: Foque em quem, o que, quando, onde, por que e como.
- Para conteudo cientifico: Preserve metodologia, resultados e conclusoes.
- Para artigos de opiniao: Mantenha os argumentos principais e pontos de apoio.
- Para paginas de produtos: Mantenha recursos principais, especificacoes e diferenciais.
- Para documentacao tecnica: Preserve exemplos de codigo, parametros e instrucoes.

Seu resumo deve ser significativamente mais curto que o conteudo original, mas abrangente o suficiente para funcionar como fonte de informacao. Mire em cerca de 25-30% do tamanho original, a menos que o conteudo ja seja conciso.

Apresente seu resumo no seguinte formato:

```
{{
   "summary": "Seu resumo aqui, estruturado com paragrafos ou bullet points conforme necessario",
   "key_excerpts": "Primeira citacao ou trecho importante, Segunda citacao, Terceira citacao, ...Adicione mais trechos conforme necessario, ate no maximo 5"
}}
```

A data de hoje e {date}.
"""


class Summary(BaseModel):
    """Resumo de pagina web com descobertas principais."""

    summary: str
    key_excerpts: str


def get_today_str() -> str:
    """Retorna a data atual formatada para exibicao."""
    now = datetime.now()
    return f"{now:%a} {now:%b} {now.day}, {now:%Y}"


def get_provider_api_key(
    db: Database,
    organization_id: uuid.UUID,
    provider_type: ProviderType,
    provider: Provider,
) -> str | None:
    """Busca a API key de um provider especifico na organizacao."""
    statement = select(OrganizationProvider).where(
        OrganizationProvider.organization_id == organization_id,
        OrganizationProvider.type == provider_type,
        OrganizationProvider.provider == provider,
        OrganizationProvider.is_active == True,
    )
    org_provider = db.exec(statement).first()
    return org_provider.credentials.get("apiKey", "") if org_provider else None


def get_model(
    provider: Provider,
    api_key: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> ChatOpenAI:
    """Cria o modelo de LLM baseado no provedor.

    Args:
        provider: Provedor do modelo (OPENAI, OPENROUTER, etc)
        api_key: API key do provedor
        model: Nome/ID do modelo
        temperature: Temperatura para geracao (default: 0.7)
        max_tokens: Maximo de tokens de saida (opcional)

    Returns:
        Instancia do modelo configurado
    """
    kwargs = {
        "model": model,
        "temperature": temperature,
        "openai_api_key": api_key,
    }

    if max_tokens:
        kwargs["max_tokens"] = max_tokens

    if provider == Provider.OPENROUTER:
        kwargs["openai_api_base"] = openrouter_base_url

    return ChatOpenAI(**kwargs)


async def summarize_webpage(model: BaseChatModel, webpage_content: str) -> str:
    """Sumariza o conteudo de uma pagina web usando modelo de IA.

    Args:
        model: Modelo de chat configurado para sumarizacao
        webpage_content: Conteudo bruto da pagina web

    Returns:
        Resumo formatado com excertos principais, ou conteudo original se falhar
    """
    try:
        prompt_content = SUMMARIZE_WEBPAGE_PROMPT.format(
            webpage_content=webpage_content, date=get_today_str()
        )

        summary = await asyncio.wait_for(
            model.ainvoke([HumanMessage(content=prompt_content)]),
            timeout=60.0,
        )

        formatted_summary = (
            f"<summary>\n{summary.summary}\n</summary>\n\n"
            f"<key_excerpts>\n{summary.key_excerpts}\n</key_excerpts>"
        )

        return formatted_summary

    except asyncio.TimeoutError:
        logging.warning(
            "Sumarizacao excedeu timeout de 60 segundos, retornando conteudo original"
        )
        return webpage_content
    except Exception as e:
        logging.warning(
            f"Sumarizacao falhou com erro: {str(e)}, retornando conteudo original"
        )
        return webpage_content
