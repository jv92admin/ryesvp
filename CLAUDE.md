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
- **Brand:** Lark identity — monochrome UI (`#0A0A0A` base, `#E8E8E8` accent), no decorative emojis (use Lucide icons), mobile-first. See `/lark-design-system` for full token spec.
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

## Design System: Lark

The app is transitioning to the **Lark** visual identity — dark-mode-first, monochrome UI where event imagery is the only color. The design system lives in `/lark-design-system`.

**The rule that overrides everything:** The UI is monochrome. Event imagery is the only color. Any color in UI chrome (except `--status-need-ticket` red) is a violation.

Key tokens: `--bg-primary: #0A0A0A`, `--accent: #E8E8E8` (near-white), depth via surface color stepping (no shadows), Lucide icons (1.5px stroke).

## Agent Pipeline (`.claude/agents/`)

Four specialized agents maintain visual quality. Invoke them by name for delegated, isolated work:

```
design-director → motion-choreographer → component-builder → qa-reviewer
   "What?"            "How?"               "Build it"         "Right?"
```

| Agent | When to invoke |
|-------|---------------|
| `design-director` | Before building — get visual specs, audit design compliance, extend token system |
| `motion-choreographer` | Adding animation/transitions — get spring configs, stagger timing, gesture specs |
| `component-builder` | Implementation — builds screens and components to spec, never improvises values |
| `qa-reviewer` | After implementation — audits monochrome compliance, token usage, motion, a11y |

**Pipeline rules:**
- Agents run in isolated context (separate from main conversation)
- `PIPELINE.md` in `.claude/agents/` defines escalation paths between agents
- All agents reference `/lark-design-system` as the shared source of truth
- Builder can't implement a motion spec → escalate to choreographer
- QA finds a pattern not in specs → escalate to design-director

## Skills (`.claude/skills/`) — 10 total

Reference knowledge and workflows invoked inline with `/skill-name`:

### UI/UX (primary focus)

| Skill | When to use |
|-------|-------------|
| `/lark-design-system` | Design tokens, component specs, color system, typography, spacing, elevation, imagery rules |
| `/ui-system` | Implementation patterns — token migration map, Tailwind conventions, component inventory, responsive patterns |
| `/ux-comms` | Copy authority — Lark voice, section headers, CTA text, copy by surface, onboarding |
| `/engagement` | Full messaging system — toast wiring, 9 notification types, 5 share text families, brand voice |

### Other domains

| Skill | When to use |
|-------|-------------|
| `/feature-spec` | Starting new feature work, writing specs |
| `/data-model` | Touching schema, types, data access functions, adding DB fields |
| `/ingestion` | Adding/fixing scrapers, enrichment pipeline, cron jobs |
| `/scraper-ops` | Scraper inventory, field coverage, health checks, enrichment pipeline ops |
| `/roadmap` | Planning sessions, prioritization, updating backlog |
| `/code-quality` | Testing, type safety, linting, visual compliance grep targets |

### How agents and skills connect

- **Agents** = isolated specialists you delegate to. They run in their own context and report back. Use for review, audit, and focused implementation.
- **Skills** = reference knowledge loaded inline. They add context to your current conversation. Use for conventions, specs, and copy standards.
- All agents read `/lark-design-system` and `/ui-system` before doing any visual work.
- All agents read `/ux-comms` before writing any user-facing copy.
- The `qa-reviewer` agent uses `/ui-system` grep targets for compliance checking.
- The `component-builder` agent follows `/ui-system` Tailwind conventions and token patterns.
