# PLAN.md — AI Chat App with TanStack AI + Durable Transports

## App Description

A persistent, resumable AI chat application built with TanStack AI and Durable Transports. Users can have multi-turn conversations with Claude models, set their Anthropic API key directly from the UI, and pick from available Claude models. Conversations survive page refreshes and are synced across browser tabs in real time.

---

## User Flows

### Flow 1: First Visit — Set API Key
1. User lands on the home page.
2. A settings panel / banner prompts them to enter their Anthropic API key (not yet configured).
3. User clicks "Settings" (gear icon in header).
4. Settings dialog opens with a masked text input for the API key and a model selector dropdown.
5. User pastes their API key, selects a Claude model (default: `claude-sonnet-4-5`), and clicks "Save".
6. Key is stored in the browser's `localStorage` under `anthropic_api_key`; model preference stored under `preferred_model`.
7. Dialog closes; chat interface becomes active.

### Flow 2: Start a New Conversation
1. User sees the chat list panel (left sidebar) and a "New Chat" button.
2. User clicks "New Chat" → a new conversation record is created (via API route → Postgres).
3. Chat view opens on the right (or full screen on mobile) with an empty message thread.
4. User types a message in the input box and presses Enter or clicks "Send".
5. Message is submitted to the AI route, which streams Claude's response back via the durable transport.
6. Both the user message and Claude's response appear in the thread, streamed token by token.

### Flow 3: Resume a Conversation
1. User returns to the app (new tab, page refresh, or later session).
2. The conversation list shows all past conversations with their titles (auto-generated from first message) and timestamps.
3. User clicks a conversation → full message history loads from the durable stream.
4. User can continue the conversation from where they left off.

### Flow 4: Switch Claude Model
1. User clicks the gear icon → Settings dialog opens.
2. User changes model in the dropdown (options: `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`).
3. Saves → new messages in all subsequent conversations use the selected model.

### Flow 5: Delete a Conversation
1. User hovers over a conversation in the sidebar → a trash icon appears.
2. User clicks trash → confirmation dialog.
3. Confirmed → conversation record deleted from Postgres; conversation disappears from the list.

---

## Data Model

```typescript
// src/db/schema.ts

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("New Chat"),
  stream_id: text("stream_id").notNull().unique(), // Durable Streams stream identifier
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

> **Note:** Individual messages are NOT stored in Postgres. They live in the Durable Stream referenced by `stream_id`. The `conversations` table only holds metadata (title, pointer to the stream, timestamps).

---

## Key Technical Decisions

| Problem | Product | Package |
|---|---|---|
| AI chat with persistent, resumable, multi-tab-synced sessions | Durable Transport for TanStack AI | `@durable-streams/tanstack-ai-transport` |
| Conversation metadata (list of chats, titles, timestamps) | Electric SQL shapes + TanStack DB | `@electric-sql/client` + `@tanstack/db` |
| Postgres schema + migrations | Drizzle ORM | `drizzle-orm` + `drizzle-kit` |
| Full-stack routes + server handlers | TanStack Start | `@tanstack/react-start` |
| UI components | shadcn/ui + Tailwind CSS | `@/components/ui/*` |

**Why Durable Transport:** Chat messages are an ordered, append-only event stream — exactly what Durable Streams is built for. The transport makes sessions resumable and multi-tab-synced without extra infrastructure.

**Why Electric for conversations:** The conversations list is a small CRUD entity that multiple tabs should see live (e.g., new chat created in one tab appears in the sidebar of another). Electric shapes + TanStack DB is the right fit.

**API key handling:** The Anthropic API key is stored in `localStorage` on the client. Server-side API routes read it from the `Authorization` header sent by the client — the key is never stored in Postgres or environment variables. The model preference is also stored in `localStorage`.

**Before the first stream operation**, the coder must follow the Electric CLI flow in the `room-messaging` skill and store the resulting service URL + secret via `set_secret`.

---

## Required Skills

The coder must read these intent skills (in node_modules) before writing any code:

### Always required
- `node_modules/@electric-sql/client/skills/electric-new-feature/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md`

### For this app
- `node_modules/@durable-streams/tanstack-ai-transport/skills/tanstack-ai/SKILL.md` — AI chat transport (durable, resumable)

---

## Implementation Tasks

### Phase 0: Infrastructure Setup
- [ ] Run Electric CLI provisioning flow (per `room-messaging` skill) to get Durable Streams service URL + secret; store via `set_secret`
- [ ] Verify `DATABASE_URL`, `ELECTRIC_URL`, `DURABLE_STREAMS_URL`, `DURABLE_STREAMS_SECRET` are available in `.env`
- [ ] Generate and run Drizzle migration for the `conversations` table

### Phase 1: Schema + API Routes

- [ ] Define Drizzle schema in `src/db/schema.ts` — `conversations` table as specified above
- [ ] Generate migration with `drizzle-kit generate` and apply with `drizzle-kit migrate`
- [ ] Create Electric shape proxy route at `src/routes/api/shape-proxy.ts` — proxies the `conversations` shape with auth header injection
- [ ] Create `GET /api/conversations` route — lists all conversations (via Electric shape, not direct DB query)
- [ ] Create `POST /api/conversations` route — inserts a new conversation row, provisions a new Durable Stream for it, returns `{ id, stream_id }`
- [ ] Create `DELETE /api/conversations/:id` route — deletes conversation from Postgres
- [ ] Create `POST /api/chat` route — the AI handler; reads API key from `Authorization` header, reads model from request body, proxies to Claude via `@durable-streams/tanstack-ai-transport`, writes response into the conversation's durable stream

### Phase 2: Client-Side State + Collections

- [ ] Set up TanStack DB collection for `conversations` in `src/lib/collections.ts` — backed by the Electric shape proxy, with `timestamptz` parser for `created_at` and `updated_at`
- [ ] Create `useConversations()` live-query hook — returns all conversations sorted by `updated_at` desc
- [ ] Create `useConversation(id)` live-query hook — returns a single conversation by ID
- [ ] Create settings store in `src/lib/settings.ts` — reads/writes `anthropic_api_key` and `preferred_model` from `localStorage`, exposes a React context/hook

### Phase 3: UI — Layout + Settings

- [ ] Root layout `src/routes/__root.tsx` — two-column layout: sidebar (conversation list) + main content area; `<ClientOnly>` wrapper for live-query consumers
- [ ] Header component `src/components/Header.tsx` — app title + gear icon button that opens settings dialog
- [ ] Settings dialog `src/components/SettingsDialog.tsx`:
  - Masked input for Anthropic API key (show/hide toggle)
  - Model selector dropdown with options: `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`
  - "Save" and "Cancel" buttons
  - Reads/writes from the settings store
- [ ] Empty state component for when no API key is set — prompt with a "Open Settings" button

### Phase 4: UI — Conversation Sidebar

- [ ] `src/components/ConversationSidebar.tsx`:
  - "New Chat" button at top
  - List of conversations sorted by recency, each showing title + relative timestamp
  - Active conversation highlighted
  - Hover → trash icon → delete with confirmation dialog
- [ ] Wire "New Chat" to `POST /api/conversations` and navigate to the new chat route

### Phase 5: UI — Chat View

- [ ] Chat route `src/routes/chat.$id.tsx` (with `ssr: false`) — full chat interface for a specific conversation
- [ ] `src/components/ChatThread.tsx` — scrollable message list, renders user and assistant messages with distinct styling; auto-scrolls to bottom on new message
- [ ] `src/components/MessageInput.tsx` — textarea for user input, "Send" button, disabled when no API key is set; Enter submits (Shift+Enter for newline)
- [ ] Wire `useChat()` from `@tanstack/ai-react` with the durable transport, pointing to `/api/chat`; pass API key in `Authorization` header and model in request body
- [ ] Loading/streaming state — show a pulsing "..." bubble while Claude is generating
- [ ] Error state — toast notification if the API call fails (e.g., invalid API key)

### Phase 6: Auto-Title Generation
- [ ] After the first assistant message in a new conversation, extract the first 60 characters as the conversation title and `PATCH /api/conversations/:id` to update the title in Postgres

### Phase 7: Home Route
- [ ] `src/routes/index.tsx` — if no conversations exist, show welcome screen with "New Chat" CTA; if conversations exist, redirect to the most recent one

### Phase 8: Final Polish
- [ ] Mobile responsive layout — sidebar collapses to a drawer on small screens (hamburger menu)
- [ ] Keyboard shortcut: `Cmd/Ctrl+K` or `Cmd/Ctrl+N` for "New Chat"
- [ ] Empty chat state illustration/text: "Ask Claude anything…"
- [ ] Write `README.md` documenting setup, env vars, and how to configure the API key

---

## Parallel Work

### Sequential (must be in order)
1. Phase 0: Infrastructure setup + secrets
2. Phase 1: Schema + migrations (must exist before anything else)
3. Phase 2: Collections + hooks (depends on shape proxy existing)

### Parallel Group A (after sequential — independent UI tracks)
- [ ] Phase 3: Layout + Settings dialog
- [ ] Phase 4: Conversation Sidebar

### Parallel Group B (after Group A)
- [ ] Phase 5: Chat view (depends on settings hook + sidebar navigation)
- [ ] Phase 6: Auto-title generation (depends on chat route existing)

### Sequential wrap-up
- Phase 7: Home route (depends on chat route)
- Phase 8: Polish + README
