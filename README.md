# PineAI

Aplicacao de chat com integracao de agentes de IA e gestao multi-tenant de organizacoes.

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

# Instalar dependencias
pip install -r requirements.txt

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas configuracoes

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

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
echo "NEXT_PUBLIC_API_URL=http://localhost:8888" > .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
pineai/
├── app/                    # Next.js pages e layouts
├── components/             # React components
│   └── ui/                 # shadcn/ui primitives
├── lib/                    # Utilitarios frontend
│   ├── api.ts              # Cliente HTTP para backend
│   └── auth.tsx            # Context de autenticacao
├── server/                 # Backend Python
│   ├── src/
│   │   ├── api.py          # FastAPI app
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   └── routers/        # API routes
│   └── db/                 # Alembic migrations
└── public/                 # Assets estaticos
```

## Funcionalidades

- Autenticacao com JWT (login, registro)
- Gestao de organizacoes multi-tenant
- Sistema de permissoes RBAC
- Convites para organizacoes
- Gestao de membros e roles
- Threads de conversacao
- Prompts de sistema
- Configuracao de provedores (LLM: OpenAI, OpenRouter, Anthropic, Google; Web Search: Tavily)

## Scripts

### Frontend

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de producao
npm run start    # Servidor de producao
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

O backend expoe os seguintes endpoints:

| Endpoint | Descricao |
|----------|-----------|
| `POST /auth/login` | Login, retorna JWT |
| `POST /auth/register` | Registro de usuario |
| `GET /auth/me` | Usuario atual e memberships |
| `GET /organizations/{id}/threads` | Listar threads |
| `GET /organizations/{id}/prompts` | Listar prompts |
| `GET /organizations/{id}/members` | Listar membros |
| `GET /organizations/{id}/roles` | Listar roles |
| `GET /organizations/{id}/models` | Modelos disponiveis |
| `GET /organizations/{id}/providers` | Provedores configurados (LLM, Web Search) |

Documentacao completa da API em: `http://localhost:8888/docs`
