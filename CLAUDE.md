# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (both servers)
npm run dev                # Backend (3001) + Frontend (5173) in parallel
npm run dev:backend        # Express backend only (tsx watch, hot reload)
npm run dev:frontend       # Vite frontend only

# Build
npm run build              # Builds shared → backend → frontend (in order)

# Database
npm run db:migrate         # Run Prisma migrations
npm run db:seed            # Seed admin user (apps/backend/prisma/seed.ts)
npm run db:studio          # Open Prisma Studio GUI
npx prisma migrate dev --name <name> --schema apps/backend/prisma/schema.prisma  # New migration

# Type checking
cd apps/frontend && npx tsc --noEmit     # Frontend type check
cd apps/backend && npx tsc --noEmit      # Backend type check
```

No linter or test runner is configured.

## Architecture

npm workspaces monorepo with three packages:

- **`packages/shared`** — TypeScript types (DTOs, enums), Zod validation schemas, and constants. Imported as `@seo-platform/shared` by both apps. Must be built first (`npm run build` handles order).
- **`apps/backend`** — Express 4 REST API (ESM, `tsx watch`). PostgreSQL via Prisma. JWT auth (7-day tokens). AI content generation streams via Server-Sent Events.
- **`apps/frontend`** — React 18 SPA (Vite). React Router v7 with lazy-loaded pages. TanStack React Query for server state. Tailwind CSS v3 with Japanese gaming/anime theme. Recharts for graphs.

### Backend request flow

`helmet → cors → express.json(5mb) → [authMiddleware on protected routes] → route handler → errorHandler`

Auth middleware reads `Authorization: Bearer <token>`, verifies JWT, attaches `req.user` (userId, email). Returns 401 on failure.

Validation middleware uses Zod schemas from `@seo-platform/shared`. Error handler formats ZodError into 400 responses with `details` array.

### API routes

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/api/auth` | Public (login), Protected (me) | JWT authentication |
| `/api/sites` | Protected | Site CRUD + WordPress connection test |
| `/api/articles` | Protected | Article CRUD |
| `/api/articles/:id/publish` | Protected | WordPress publishing |
| `/api/ai/generate/seo` | Protected | SEO content generation (SSE stream) |
| `/api/ai/generate/sponsored` | Protected | Sponsored content generation (SSE stream) |
| `/api/orders` | Protected | Order CRUD |
| `/api/revenue` | Protected | Revenue CRUD + stats aggregation |
| `/api/dashboard/stats` | Protected | Aggregated dashboard statistics |
| `/api/rank` | Protected | Rank calculation from total revenue |

Paginated endpoints return `{ data[], total, page, pageSize, totalPages }`. AI endpoints stream SSE with event types: `text_delta`, `done`, `error`.

### Database (Prisma + PostgreSQL)

5 models: `User`, `Site`, `Article`, `Order`, `Revenue`. Schema at `apps/backend/prisma/schema.prisma`. Cascade deletes on Site→Article/Order/Revenue. WordPress credentials encrypted with AES-256-GCM.

### Frontend data flow

Axios client (`src/api/client.ts`) auto-injects JWT from localStorage, redirects to `/login` on 401. Custom hooks in `src/hooks/` wrap TanStack Query for each resource. SSE streaming handled in `src/api/sse.ts` for AI generation.

Vite proxies `/api/*` to `http://localhost:3001` in dev.

### Rank system

Global player rank based on total revenue (SUM of revenues table). 6 tiers: BRONZE (0-500€), ARGENT (501-1500€), OR (1501-3000€), PLATINE (3001-5000€), DIAMANT (5001-7500€), LEGENDAIRE (7501-10000€). Computed server-side at `/api/rank`. UI adapts colors via CSS variables `[data-rank]` on root layout.

### Design system

Japanese gaming/anime theme. Fonts: Zen Dots (arcade headings), M PLUS Rounded 1c (body). Custom Tailwind classes defined in `src/index.css`: `game-card`, `btn-gold`, `btn-royal`, `btn-sakura`, `input-game`, `select-game`, `label-game`, `table-game`, `badge-*`, `glow-*`. Rank-adaptive CSS variables change border/glow colors globally.

## Environment variables

Required in `seo-platform/.env` (loaded by backend via dotenv):

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — 64-char hex string for JWT signing
- `ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM
- `ANTHROPIC_API_KEY` — Claude API key (app works without it except AI generation)
- `PORT` — Backend port (default 3001)
- `NODE_ENV` — development or production
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Used by seed script

## Key conventions

- All user-facing text is in French.
- Backend uses ESM (`.js` extensions in imports even for `.ts` files).
- Shared types must be updated when changing API contracts — both apps depend on `@seo-platform/shared`.
- After modifying the Prisma schema, run migration then rebuild shared if types changed.
- Frontend uses named exports for UI components (`{ Modal }`, `{ StatusBadge }`) and default exports for pages.
