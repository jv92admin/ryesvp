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

**Delegate to the QA agent.** After any UI change, run the review checklist from `.claude/agents/qa-reviewer.md`. That agent owns the full visual compliance audit — monochrome rule, token compliance, motion accuracy, brand copy, accessibility, and performance.

For quick self-checks during development, these are the highest-priority grep targets:

```bash
# Monochrome violations — any color in UI chrome is a bug
grep -rn "action-engage\|signal-going\|signal-interested\|signal-info\|brand-primary" src/components/

# Shadow violations — Lark uses surface color stepping, never shadows
grep -rn "shadow-sm\|shadow-md\|shadow-lg" src/components/

# Hardcoded colors — all colors must use CSS custom property tokens
grep -rn "#B45309\|#16A34A\|#F59E0B\|#3B82F6\|#FAFAFA\|#FFFFFF" src/components/

# Old token aliases — should be zero
grep -rn "brand-primary\|brand-border\|brand-primary-light" src/
```

The full token migration map (old → new) lives in `ui-system.md`.

## Testing Strategy

Priority items from backlog: unit tests for data layer, integration tests for API routes, scraper reliability tests. No unit or integration tests yet.

## Key References

| File | Purpose |
|------|---------|
| `.claude/agents/qa-reviewer.md` | Full visual compliance checklist |
| `/lark-design-system` skill | Source of truth for all visual decisions |
| `/ui-system` skill | Token migration map, implementation patterns, grep targets |
