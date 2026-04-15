# Claude Chat

A persistent, resumable AI chat application built with TanStack AI and Durable Transports. Chat with Claude models, set your API key from the UI, and enjoy conversations that survive page refreshes and sync across browser tabs.

Generated with [one-shot-electric-app](https://github.com/anthropics/one-shot-electric-app) — an Electric SQL + TanStack DB + shadcn/ui scaffold.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for local Postgres + Electric)

## Setup

```bash
pnpm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Purpose | How to get it |
|---|---|---|
| `DATABASE_URL` | Postgres connection | Auto-provisioned by `docker compose up` (local) or from your Electric Cloud claim |
| `ELECTRIC_URL` | Electric shape sync endpoint | `http://localhost:3000` (local) or `https://api.electric-sql.cloud` |
| `ELECTRIC_SOURCE_ID` | Electric Cloud source (cloud mode only) | From the Cloud claim URL or `npx @electric-sql/cli` |
| `ELECTRIC_SECRET` | Electric Cloud auth (cloud mode only) | Same source as above |
| `DS_SERVICE_ID` | Durable Streams service ID | `npx @electric-sql/cli services create streams` |
| `DS_SECRET` | Durable Streams auth secret | Same source as above |

### Anthropic API Key

The Anthropic API key is configured from the UI (Settings dialog). It is stored in `localStorage` and sent to the server via request headers -- it is never stored in the database or environment variables.

## Running

```bash
# Start local infra (Postgres + Electric)
docker compose up -d

# Run migrations
pnpm drizzle-kit migrate

# Start the dev server
pnpm dev
```

App runs at `http://localhost:5174`.

> **Inside the agent sandbox**, `pnpm dev:start` launches Vite behind a Caddy reverse proxy with HTTP/2 multiplexing (avoids the browser's ~6-connection-per-origin SSE cap). Outside the sandbox, `pnpm dev` runs Vite directly.
>
> **HTTPS setup (one-time):** from the Electric Studio repo root run `pnpm trust-cert` and restart your browser.

## Architecture

- **Sync**: Electric SQL shapes → TanStack DB collections → `useLiveQuery` (for conversation metadata)
- **Chat messages**: Durable Streams via `@durable-streams/tanstack-ai-transport` (persistent, resumable, multi-tab synced)
- **AI**: TanStack AI with Anthropic adapter (`@tanstack/ai-anthropic`) — Claude models only
- **Mutations**: Optimistic via `collection.insert/update/delete`, reconciled through API routes
- **Forms / UI**: shadcn/ui + Tailwind CSS + lucide-react
- **Validation**: zod/v4

See [`PLAN.md`](./PLAN.md) for the full implementation plan.

## Tests

```bash
pnpm test          # unit + integration tests
pnpm build         # type check + production build
```

## Deploying

The scaffold is dev-oriented. For production deployment patterns, see the [Electric SQL docs](https://electric-sql.com/docs).
