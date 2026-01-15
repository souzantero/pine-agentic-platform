# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PineChat is a chat application with AI agent integration and multi-tenant organization management. The project uses a decoupled architecture:

- **Frontend**: Next.js 16.1 + React 19 (TypeScript)
- **Backend**: Python FastAPI with SQLAlchemy ORM and PostgreSQL

## Commands

### Frontend (root directory)

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend (server directory)

```bash
cd server
source .venv/bin/activate    # Activate virtual environment

# Run server
uvicorn src.api:app --reload --port 8888

# Database migrations
alembic upgrade head         # Run migrations
alembic revision --autogenerate -m "description"  # Create migration

# Docker for local PostgreSQL
docker-compose up -d
```

## Architecture

### System Design

```
┌─────────────────┐         ┌─────────────────┐
│    Frontend     │  HTTP   │     Backend     │
│   Next.js App   │ ──────► │  FastAPI + DB   │
│  localhost:3000 │  JWT    │  localhost:8888 │
└─────────────────┘         └─────────────────┘
```

- Frontend is a React SPA that communicates with the Python backend via REST API
- Authentication uses JWT tokens stored in localStorage
- Current organization is managed client-side in localStorage

### Multi-Tenant RBAC System

The app implements role-based access control with organization scoping:

- **Users** can belong to multiple **Organizations** with different **Roles**
- **Roles** contain **Permissions** (THREADS_*, AGENTS_*, MEMBERS_*, ROLES_*, ORGANIZATION_MANAGE, PLATFORM_MANAGE, PROMPTS_*)
- Platform roles (null organizationId) vs Organization-scoped roles

### Authentication Flow

1. User logs in via `/auth/login` endpoint, receives JWT token
2. Token is stored in localStorage (`pinechat_token`) via `lib/storage.ts`
3. `SessionProvider` (lib/session.tsx) manages user state and calls `/auth/me` to validate session
4. Current organization ID is stored in localStorage (`pinechat_current_org`)
5. All API calls include `Authorization: Bearer <token>` header via `lib/api.ts`

### Key Files

**Frontend:**
- `lib/api.ts` - HTTP client for backend communication
- `lib/session.tsx` - SessionContext with `useSession()` hook providing user, memberships, currentMembership, hasPermission()
- `lib/storage.ts` - LocalStorage management (token, current org, chat settings)
- `lib/hooks/` - React hooks for API communication (use-threads, use-models, use-members, etc.)
- `lib/types/` - TypeScript types organized by category (entities, api, enums, inputs, results)

**Frontend Components (organized by feature):**
- `components/chat/` - Chat interface components (chat-area, agent-selector, chat-settings)
- `components/layout/` - Layout components (header, sidebar, org-switcher)
- `components/members/` - Member management components
- `components/prompts/` - Prompt management components
- `components/ui/` - shadcn/ui primitives

**Backend:**
- `server/src/api.py` - FastAPI app with CORS configuration
- `server/src/routers/` - API route handlers (auth, threads, prompts, members, etc.)
- `server/src/schemas.py` - Pydantic models with camelCase serialization
- `server/src/entities.py` - SQLModel ORM entities
- `server/src/agent.py` - AI agent invocation logic
- `server/db/` - Alembic migrations

### API Structure

All API routes are served by the Python backend at `localhost:8888`:

- `/auth/*` - Login, register, current user (me)
- `/organizations` - Create organization
- `/organizations/{org_id}` - Organization CRUD
- `/organizations/{org_id}/threads` - Conversation threads
- `/organizations/{org_id}/threads/{thread_id}/agents/{agent_id}/runs/invoke` - AI agent invocation (streaming)
- `/organizations/{org_id}/prompts` - System prompts
- `/organizations/{org_id}/members` - Member management
- `/organizations/{org_id}/invites` - Organization invites
- `/organizations/{org_id}/roles` - Role management
- `/organizations/{org_id}/models` - Available AI models
- `/organizations/{org_id}/providers` - Provider configuration (LLM, Web Search, etc.)
- `/invites/{token}` - Public invite info and accept

### UI Components

- Uses shadcn/ui (configured in components.json with "new-york" style)
- Primitives in `/components/ui/`
- Add components: `npx shadcn@latest add <component>`

### Page Flow

1. `/login`, `/signup` - Public auth pages
2. `/onboarding` - Organization creation (requires auth, no org)
3. `/invite/[token]` - Accept organization invites
4. `/` - Main chat interface (requires auth + active org)
5. `/settings`, `/settings/members`, `/settings/providers` - Organization management

## Code Conventions

- Comments are in Portuguese (pt-BR)
- Path alias: `@/*` maps to project root
- All frontend components use "use client" directive (SPA pattern)
- Backend uses camelCase for JSON responses (Pydantic alias_generator)

## Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8888
```

**Backend (server/.env):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
```
