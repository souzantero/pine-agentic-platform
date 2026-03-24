# PINE

Aplicação de chat com integração de agentes de IA e gestão multi-tenant de organizações.

## Stack

- **Frontend**: Next.js 16.1 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Python FastAPI + SQLAlchemy + PostgreSQL
- **Auth**: JWT com tokens armazenados no localStorage

## Requisitos

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Docker (opcional, para PostgreSQL local)

## Setup

### 1. Backend

```bash
cd server

# Criar virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou .venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar PostgreSQL (com Docker)
docker-compose up -d

# Rodar migrations
alembic upgrade head

# Iniciar servidor
uvicorn src.api:app --reload --port 8888
```

### 2. Frontend

```bash
# Na raiz do projeto

# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "NEXT_PUBLIC_API_URL=http://localhost:8888" > .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
pine/
├── app/                    # Next.js pages e layouts
├── components/             # React components
│   └── ui/                 # shadcn/ui primitives
├── lib/                    # Utilitários frontend
│   ├── api.ts              # Cliente HTTP para backend
│   └── session.tsx         # Context de sessão/autenticação
├── server/                 # Backend Python (arquitetura modular)
│   ├── src/
│   │   ├── api.py          # FastAPI app
│   │   ├── core/           # Base compartilhada (env, schemas, storage, email)
│   │   ├── database/       # Conexão, entities, dependencies
│   │   ├── auth/           # Autenticação, JWT, verificação email, reset senha
│   │   ├── organization/   # Organizações, members, invites
│   │   ├── roles/          # Gestão de roles
│   │   ├── threads/        # Threads de chat, streaming SSE
│   │   ├── providers/      # Configuração de provedores LLM
│   │   ├── models/         # Modelos de IA disponíveis
│   │   ├── configs/        # Configurações de ferramentas
│   │   ├── billing/        # Monetização com Stripe
│   │   ├── knowledge/      # Collections, documentos e RAG (pipeline ETL)
│   │   ├── agent/          # Agente de IA (LangGraph)
│   │   └── web/            # Ferramentas web (search, fetch)
│   └── db/                 # Alembic migrations
└── public/                 # Assets estáticos
```

## Funcionalidades

**Autenticação e Usuários:**
- Autenticação com JWT (login, registro)
- Verificação de email no registro (Resend)
- Recuperação e alteração de senha
- Gestão de conta do usuário

**Organizações:**
- Gestão de organizações multi-tenant
- Sistema de permissões RBAC
- Convites para organizações
- Gestão de membros e roles
- Wizard de onboarding multi-step

**Chat e IA:**
- Threads de conversação com streaming em tempo real
- Renderização de Markdown nas mensagens
- Agente de IA com ferramentas (web_search, web_fetch, knowledge_search)
- Configuração de ferramentas por organização
- Prompts de sistema
- Configuração de provedores (LLM: OpenAI, OpenRouter, Anthropic, Google; Web Search: Tavily)

**Base de Conhecimento (RAG):**
- Upload e processamento de documentos
- Múltiplas estratégias de chunking
- Busca híbrida (semântica + keywords) com RRF
- Ferramenta de busca RAG integrada ao agente

**Monetização:**
- Integração com Stripe (checkout, portal, webhooks)
- Planos e limites de uso
- Página de billing e assinaturas

**Outros:**
- Landing page profissional
- Páginas de Política de Privacidade e Termos de Uso

## Scripts

### Frontend

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint
```

### Backend

```bash
cd server
uvicorn src.api:app --reload --port 8888    # Servidor dev
alembic upgrade head                         # Rodar migrations
alembic revision --autogenerate -m "msg"     # Criar migration
```

## API

O backend expõe os seguintes endpoints:

| Endpoint | Descrição |
|----------|-----------|
| `POST /auth/login` | Login, retorna JWT |
| `POST /auth/register` | Registro de usuário com verificação de email |
| `GET /auth/me` | Usuário atual e memberships |
| `POST /auth/verify-email` | Verificar email com token |
| `POST /auth/forgot-password` | Solicitar reset de senha |
| `POST /auth/reset-password` | Resetar senha com token |
| `POST /auth/change-password` | Alterar senha (autenticado) |
| `GET /organizations/{id}/threads` | Listar threads |
| `GET /organizations/{id}/prompts` | Listar prompts |
| `GET /organizations/{id}/members` | Listar membros |
| `GET /organizations/{id}/roles` | Listar roles |
| `GET /organizations/{id}/models` | Modelos disponíveis |
| `GET /organizations/{id}/providers` | Provedores configurados (LLM, Web Search) |
| `GET /organizations/{id}/configs` | Configurações de ferramentas |
| `GET /organizations/{id}/collections` | Collections de conhecimento |
| `GET /organizations/{id}/billing` | Status e uso do billing |
| `POST /organizations/{id}/billing/checkout` | Criar sessão de checkout Stripe |

Documentação completa da API em: `http://localhost:8888/docs`
