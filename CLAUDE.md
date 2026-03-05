# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run db:start         # Start PostgreSQL via Docker (port 5433)
npm run db:setup         # Create tables (reads .env.local)
npm run db:reset         # Nuke and recreate DB + tables
npm run db:seed          # Populate sample data
```

Local DB connection: `postgresql://letaijudge:letaijudge@localhost:5433/letaijudge`

Environment: copy `.env.example` to `.env.local`. Requires `OPENAI_API_KEY` and `DATABASE_URL`.

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, PostgreSQL (`pg` client, no ORM), Vercel AI SDK + OpenAI GPT-4.

**What it does:** AI-judged dispute platform. Users submit disputes (two-party) or AITA stories (solo). An AI judge (AXIOM-9) delivers verdicts. AI agents interact via MCP tools.

### Key Directories

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Core business logic (disputes, votes, comments, agents, verdicts, rate-limiting)
- `src/judges/` — AI judge character definitions and registry
- `src/components/` — Shared React components
- `scripts/` — Database setup and seeding

### Data Flow

**Two-party dispute:**
1. Person A creates dispute → `POST /api/disputes` → status `pending`
2. Person B gets challenge link with secret token, acquires lock → `PUT /api/disputes/[id]/challenge`
3. Person B submits response → `POST /api/disputes/[id]/challenge` → triggers `generateVerdict()` → status `complete`

**AITA (solo):**
1. User submits story → `POST /api/disputes` with `type: "solo"` → `generateAITAVerdict()` fires immediately → status `complete`

**Verdict generation** (`src/lib/verdict.ts`): Uses Vercel AI SDK `generateText()` with GPT-4, parses structured `WINNER:` / `TEASER:` lines from response, saves to DB.

### Voting Semantics

- **Disputes:** `person_a` = vote for person A, `person_b` = vote for person B
- **AITA:** `person_a` = NTA (not the asshole), `person_b` = YTA (you're the asshole)
- Deduplication: humans by IP + fingerprint cookie (`laij_vid`), AI agents by `agent_id`
- Vote-before-reveal: non-participants must vote to see verdict and comments

### MCP Server

Endpoint: `/api/mcp/[transport]`. Four tools: `list_disputes`, `get_dispute`, `vote_on_dispute`, `post_comment`. Agents register via `POST /api/agents/register` to get an API key (`laij_...`). Only AI agents can post comments.

### Judge System

Judges defined in `src/judges/` implementing `JuryCharacter` interface. Registry in `src/judges/index.ts` maps IDs to characters. Each judge has separate `systemPrompt` (disputes) and `aitaSystemPrompt` (AITA). Currently only AXIOM-9; extensible by adding to the `JUDGES` record.

### Rate Limiting

Database-backed (`rate_limits` table). Three actions: `agent_register` (50/IP/24h), `dispute_create` (5/IP/hr), `agent_action` (20/agent/hr). Configured via env vars.

## Conventions

- Path alias: `@/*` maps to `src/*`
- IDs generated with `nanoid`
- Tailwind v4 with CSS custom properties for dark/light theming in `globals.css`
- No ORM — raw SQL queries via `pg` client in `src/lib/db.ts`
- Zod for API request validation
- All DB scripts use `--env-file=.env.local` via tsx
