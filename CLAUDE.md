# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PineChat is a Next.js 16.1 + React 19 full-stack chat application with AI agent integration and multi-tenant organization management. Written in TypeScript with Prisma ORM and PostgreSQL.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

Database commands:
```bash
npx prisma generate   # Generate Prisma client after schema changes
npx prisma migrate dev  # Run migrations in development
npx prisma studio     # Open Prisma database GUI
```

Docker for local PostgreSQL:
```bash
docker-compose up -d  # Start PostgreSQL container
```

## Architecture

### Multi-Tenant RBAC System

The app implements role-based access control with organization scoping:

- **Users** can belong to multiple **Organizations** with different **Roles**
- **Roles** contain **RolePermissions** (fixed enum: THREADS_*, AGENTS_*, MEMBERS_*, ROLES_*, ORGANIZATION_MANAGE, PLATFORM_MANAGE)
- Platform roles (null organizationId) vs Organization-scoped roles

### Authentication Flow

1. Cookie-based sessions: `session` (user auth) and `current_org` (active organization)
2. `AuthProvider` (lib/auth.tsx) - Client-side React Context for user/organization state
3. `validateSession()`, `validatePermission()` (lib/api-auth.ts) - Server-side validation
4. Middleware (middleware.ts + lib/proxy.ts) handles route protection and redirects

### Key Files

- `lib/auth.tsx` - AuthContext with `useAuth()` hook providing user, memberships, currentOrg, hasPermission()
- `lib/api-auth.ts` - Server-side auth validation for API routes
- `lib/db.ts` - Prisma client singleton
- `db/schema.prisma` - Database schema

### API Structure

All API routes are in `/app/api/`:
- `/auth/*` - Login, register, logout, current user
- `/organizations/*` - Create org, get/set current org, settings
- `/members/*` - List, invite, remove members
- `/invites/*` - Create and accept invites
- `/roles/*` - List roles
- `/threads/*` - Create and list conversation threads

API routes use `validateSession()` or `validatePermission()` from lib/api-auth.ts.

### UI Components

- Uses shadcn/ui (configured in components.json with "new-york" style)
- Primitives in `/components/ui/`
- Add components: `npx shadcn@latest add <component>`

### Page Flow

1. `/login`, `/signup` - Public auth pages
2. `/onboarding` - Organization creation/selection (requires auth, no org)
3. `/invite/[token]` - Accept organization invites
4. `/` - Main chat interface (requires auth + active org)
5. `/members`, `/settings` - Organization management

## Code Conventions

- Comments are in Portuguese (pt-BR)
- Path alias: `@/*` maps to project root
- Server Components by default; use "use client" directive for client components
