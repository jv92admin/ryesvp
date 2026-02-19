# Data Model & Access Patterns

You are working on the database schema, data types, or data access layer.

## Core Rule

> **displayTitle is computed ONCE at the data layer, never in components.**

`displayTitle` = TM title if `tmPreferTitle` is true, else `event.title`. Computed in `src/db/events.ts` functions, consumed by all UI.

## Canonical Types

### EventDisplay — THE event type for UI

```typescript
type EventDisplay = EventWithVenue & {
  displayTitle: string;           // ALWAYS resolved — never null
  enrichment?: EnrichmentDisplay; // Lean subset for lists
  social?: EventSocialSignals;    // Friend counts + avatars
  performer?: PerformerDisplay | null;
  userSquad?: { id: string; hasSquad: boolean } | null;
};
```

Never create alternative event types. All UI components receive this shape.

### EnrichmentDisplay — Lean subset for list views

```typescript
type EnrichmentDisplay = {
  spotifyUrl: string | null;
  wikipediaUrl: string | null;
  genres: string[];
  tmUrl: string | null;
};
```

Full enrichment (30+ fields) only fetched via `getEventEnrichment(id)` for detail pages.

## Auth Flow

```
API Route → requireAuth() → user.dbUser.id → pass to data functions
```

- `requireAuth()` from `src/lib/auth.ts` — redirects to login if unauthenticated
- `getCurrentUser()` — returns null if unauthenticated (for optional auth)
- Always extract `user.dbUser.id` and pass to data layer. Never pass Supabase auth context to DB functions.

## Data Access Patterns

### All queries live in `src/db/`

```
src/db/
├── prisma.ts          # Singleton client
├── events.ts          # EventDisplay, getEventsWithSocialSignals, getEventDisplay
├── squads.ts          # Squad CRUD, displayTitle computation
├── friends.ts         # Friendship queries
├── users.ts           # User profiles
├── notifications.ts   # Notification creation + display text
├── communities.ts     # Groups + community queries
├── userEvents.ts      # Attendance tracking
├── enrichment.ts      # Enrichment data access
└── social.ts          # Social feed section queries
```

### Batch Query + Map Pattern

For efficiency, fetch related data in bulk and join via Map:

```typescript
async function getEnrichmentForDisplay(eventIds: string[]): Promise<Map<string, EnrichmentForDisplay>> {
  const map = new Map();
  if (eventIds.length === 0) return map;
  const enrichments = await prisma.enrichment.findMany({
    where: { eventId: { in: eventIds } },
    select: { eventId: true, /* lean fields */ },
  });
  for (const e of enrichments) map.set(e.eventId, transformed);
  return map;
}
```

Used for: enrichment, social signals, performer data. Avoids N+1 queries.

### Notification Creation

```typescript
await createNotification(recipientId, 'ADDED_TO_PLAN', {
  actorId: user.id,
  actorName: user.displayName,
  squadId: squad.id,
  eventId: event.id,
  eventTitle: event.title,
  eventDate: format(event.startDateTime, 'MMM d'),
});
```

9 notification types: `FRIEND_REQUEST_RECEIVED`, `FRIEND_REQUEST_ACCEPTED`, `ADDED_TO_PLAN`, `PLAN_CANCELLED`, `PLAN_MEMBER_JOINED`, `PLAN_MEMBER_LEFT`, `TICKET_COVERED_FOR_YOU`, `PLAN_MEETUP_CREATED`, `GROUP_MEMBER_JOINED`.

Display text and links computed in `getNotificationText()` and `getNotificationLink()`.

## Adding New Data Access Functions

Template:

```typescript
// 1. Define display type (if needed)
export type SomeDisplay = SomeModel & { computedField: string; };

// 2. Define query params interface
export interface GetSomeParams { userId: string; limit?: number; }

// 3. Implement with auth context as param
export async function getSomeData(params: GetSomeParams): Promise<SomeDisplay[]> {
  const items = await prisma.someModel.findMany({
    where: { /* filters using params */ },
    include: { /* related data */ },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
  });
  // Compute display fields BEFORE returning
  return items.map(item => ({ ...item, computedField: compute(item) }));
}
```

## Adding Enrichment Fields to UI

1. Add to `EnrichmentDisplay` type in `src/db/events.ts`
2. Add to `getEnrichmentForDisplay()` select query
3. Add to mapping in `getEventsWithSocialSignals()`
4. Add to `getEventDisplay()` return
5. Use in components

Keep `EnrichmentDisplay` lean — don't add fields you don't need in list views.

## Anti-Patterns

- Computing displayTitle in components
- Creating alternative event types for specific views
- Fetching events without enrichment (will show wrong title)
- Inline Prisma queries in API routes (use `src/db/` functions)
- Passing Supabase auth context to data functions (pass `user.dbUser.id`)
- N+1 queries (use batch + Map pattern)

## Schema Decisions

For rationale on why the schema is structured this way (why FK not M:M, why single Performer entity, etc.), see `notes/architecture/data-model.md` — Schema Decisions section.

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Schema source of truth |
| `src/db/events.ts` | EventDisplay type, list + detail queries |
| `src/db/squads.ts` | Squad CRUD with displayTitle |
| `src/db/notifications.ts` | Notification creation + display |
| `src/lib/auth.ts` | requireAuth, getCurrentUser |
| `notes/architecture/data-model.md` | Conventions + schema decisions |
