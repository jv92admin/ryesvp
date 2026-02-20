# Code Quality

You are working on testing, type safety, linting, or code health.

## Current State

- TypeScript strict mode enabled
- Prisma provides type safety across the data layer
- ESLint with Next.js config
- No unit or integration tests yet (backlog item)

## Key Patterns

- All data access through `src/db/` (not inline Prisma in routes)
- Display types computed at data layer before reaching components
- Auth checked in API routes via `requireAuthAPI()` + `handleAPIError()` (returns 401). Use `requireAuth()` only in page server components (redirects to login).
- Batch queries with Map pattern to avoid N+1

## Visual Verification

After any UI change, verify design system compliance:

- **CTA hierarchy:** Warm gold (`--action-engage`) for social actions, dark (`--action-primary`) for structural. Green (`--signal-going`) is **never** a CTA.
- **No card shadows:** `shadow-sm` and `shadow-md` should not appear on content cards. Use `border-b` (mobile) or hover borders (desktop).
- **Unified badges:** All status markers (NEW, PRESALE, SOLD OUT) use monochrome typographic treatment, not colored pills.
- **Token usage:** Grep for legacy aliases (`--brand-primary`, `--brand-border`) — prefer new tokens.
- **DevTools MCP:** When available, screenshot at 375px and 1024px+ to verify responsive layout.

## Testing Strategy

Priority items from backlog: unit tests for data layer, integration tests for API routes, scraper reliability tests. No unit or integration tests yet.
