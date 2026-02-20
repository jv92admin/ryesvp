# RyesVP

Social event discovery and planning for Austin, TX. Users find events, see what friends are attending, and coordinate group plans.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL via Supabase, Prisma 7, Supabase Auth (Google OAuth), Vercel.

## Key Conventions

- **Squad (code) / Plan (UI):** Database, API routes, types all use "Squad." User-facing UI says "Plan."
- **displayTitle:** Computed ONCE at the data layer (`src/db/`), never in components. See `/data-model`.
- **EventDisplay:** THE canonical event type for UI. No creating alternative event types.
- **Data access:** All DB queries live in `src/db/`. API routes call data functions, never inline Prisma.
- **Auth flow:** `requireAuthAPI()` in API routes (returns 401), `requireAuth()` in pages (redirects). Pass `user.dbUser.id` to data functions. Use `handleAPIError()` in route catch blocks.
- **Brand:** Green `#16A34A`, no decorative emojis (use SVG icons), Geist Sans, mobile-first.
- **Copy:** Title Case for button CTAs, sentence case for headers. "RyesVP" (capital R and VP).

## Documentation (`notes/`)

| Folder | Contents |
|--------|----------|
| `ROADMAP.md` | Priority blocks, backlog, what's next |
| `vision/` | Product philosophy, strategy |
| `architecture/` | Technical overview, data model conventions + schema decisions |
| `design/` | UI system, components, page layouts |
| `ingestion/` | Scraper field coverage, venue priorities, debug logs |
| `specs/` | Feature specs (kept after shipping as rationale) |
| `reference/` | Copy standards, share texts, notification templates |
| `ideas/` | Low-commitment brainstorms |
| `archive/` | Superseded specs and plans |

## Skill Commands

Invoke these when working in a specific domain:

| Command | When to use |
|---------|-------------|
| `/ingestion` | Adding/fixing scrapers, enrichment pipeline, cron jobs |
| `/data-model` | Touching schema, types, data access functions, adding DB fields |
| `/ui-system` | Building UI, adding components, styling, responsive layout |
| `/feature-spec` | Starting new feature work, writing specs |
| `/ux-comms` | Writing user-facing copy, toasts, notifications, share texts |
| `/roadmap` | Planning sessions, prioritization, updating backlog |
| `/code-quality` | Testing, type safety, linting |
