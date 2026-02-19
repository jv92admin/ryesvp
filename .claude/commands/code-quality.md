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
- Auth checked in API routes via `requireAuth()` before any data access
- Batch queries with Map pattern to avoid N+1

## Stub

This skill is a stub. Full content will be added when a testing strategy is established. Priority items from backlog: unit tests for data layer, integration tests for API routes, scraper reliability tests.
