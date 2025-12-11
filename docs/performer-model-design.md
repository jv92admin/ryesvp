# Performer Entity Design

> **Phase:** 1.4 of Event Discovery
> **Created:** December 10, 2025
> **Status:** Approved - Ready for implementation

---

## Problem Statement

Currently, performer data lives in the `Enrichment` model attached to each Event:
- `llmPerformer` - LLM-extracted name
- `spotifyId`, `spotifyName`, `spotifyGenres`, etc.
- `kgEntityId`, `kgName`, `kgBio`, etc.
- `tmAttractionId`, `tmAttractionName`

**Problems:**
1. Same performer at multiple events = data duplicated
2. Can't track "all events by this performer"
3. Users can't follow performers
4. No performer history

---

## Design Principles

1. **Keep it simple** - We're not building Wikipedia
2. **Universal tags** - One `tags[]` array works for genres, styles, leagues
3. **Explicit external IDs** - Dedicated columns for the 3 APIs we use
4. **Native Prisma relations** - Use junction table where relations matter

---

## Schema

### Performer Model

```prisma
model Performer {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique  // URL-friendly: "tyler-childers"
  type            PerformerType @default(OTHER)
  
  // Universal fields
  bio             String?
  imageUrl        String?
  websiteUrl      String?
  tags            String[]  // Genres for artists, styles for comedians, leagues for teams
  
  // External IDs - the 3 sources we prioritize
  spotifyId       String?
  ticketmasterId  String?
  espnId          String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  events          Event[]
  followers       UserPerformerFollow[]
  
  @@index([slug])
  @@index([type])
  @@index([name])
}

enum PerformerType {
  ARTIST    // Musicians, bands, DJs
  TEAM      // Sports teams
  COMEDIAN  // Stand-up comedians
  COMPANY   // Theater companies, dance troupes
  OTHER     // Everything else
}
```

### Event → Performer (Simple FK)

```prisma
model Event {
  // ... existing fields ...
  
  performerId     String?
  performer       Performer? @relation(fields: [performerId], references: [id])
  
  // ... rest of model ...
}
```

One performer per event. If we need openers/support acts later, we can add a `supportingActs String[]` or evolve to junction table.

### User → Performer Following (Junction Table)

```prisma
model UserPerformerFollow {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  performerId String
  performer   Performer @relation(fields: [performerId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  
  @@unique([userId, performerId])
  @@index([userId])
  @@index([performerId])
}
```

Junction table enables:
- Native Prisma `include: { performer: true }`
- Track when user followed (`createdAt`)
- Query both directions efficiently

### User Model Addition

```prisma
model User {
  // ... existing fields ...
  
  followedPerformers UserPerformerFollow[]
  
  // ... rest of model ...
}
```

---

## Example Data

### Artist
```json
{
  "name": "Tyler Childers",
  "slug": "tyler-childers",
  "type": "ARTIST",
  "bio": "Country and folk singer-songwriter from Kentucky",
  "imageUrl": "https://...",
  "tags": ["Country", "Folk", "Americana"],
  "spotifyId": "4Z8W4fKeB5YxbusRsdQVPb",
  "ticketmasterId": "K8vZ917GSz7"
}
```

### Sports Team
```json
{
  "name": "Austin FC",
  "slug": "austin-fc",
  "type": "TEAM",
  "bio": "Major League Soccer team based in Austin",
  "tags": ["MLS", "Soccer"],
  "espnId": "123456",
  "ticketmasterId": "K8vZ..."
}
```

### Comedian
```json
{
  "name": "Nate Bargatze",
  "slug": "nate-bargatze",
  "type": "COMEDIAN",
  "bio": "Stand-up comedian known for clean, observational humor",
  "tags": ["Stand-up", "Clean Comedy"],
  "ticketmasterId": "K8vZ..."
}
```

---

## Query Patterns

### Get performer's upcoming events
```typescript
const events = await prisma.event.findMany({
  where: { 
    performerId: performerId,
    startDateTime: { gte: new Date() }
  },
  orderBy: { startDateTime: 'asc' }
});
```

### Get performers I follow
```typescript
const follows = await prisma.userPerformerFollow.findMany({
  where: { userId },
  include: { performer: true },
  orderBy: { createdAt: 'desc' }
});
const performers = follows.map(f => f.performer);
```

### Find events by followed performers ("For You")
```typescript
const events = await prisma.event.findMany({
  where: {
    performer: {
      followers: { some: { userId } }
    },
    startDateTime: { gte: new Date() }
  },
  include: { performer: true, venue: true },
  orderBy: { startDateTime: 'asc' }
});
```

### Search performers by name
```typescript
const performers = await prisma.performer.findMany({
  where: { 
    name: { contains: query, mode: 'insensitive' } 
  },
  take: 20
});
```

---

## Migration Path

### Phase 1.5: Initial Implementation

1. **Add schema** - Performer, UserPerformerFollow, performerId on Event
2. **Run migration**
3. **Backfill performers** from existing `llmPerformer` + Spotify data in Enrichment
4. **Link events** to performers
5. **Build UI** - Performer popover, display on event cards

### Backfill Script Logic

```typescript
// For each event with enrichment data:
const performer = await findOrCreatePerformer({
  name: enrichment.llmPerformer || enrichment.spotifyName,
  spotifyId: enrichment.spotifyId,
  ticketmasterId: enrichment.tmAttractionId,
  tags: enrichment.spotifyGenres,
  bio: enrichment.kgBio || enrichment.kgDescription,
  imageUrl: enrichment.spotifyImageUrl || enrichment.kgImageUrl,
  type: inferTypeFromCategory(event.category),
});

await prisma.event.update({
  where: { id: event.id },
  data: { performerId: performer.id }
});
```

---

## What We're NOT Doing (Yet)

| Feature | Why Deferred |
|---------|--------------|
| Multiple performers per event | Most events have one headliner. Add later if needed. |
| Opener/support roles | Nice-to-have, not critical for MVP |
| Type-specific metadata JSON | Tags + bio + image covers what we need |
| External IDs as JSON | 3 dedicated columns is simpler and explicit |
| Sports home/away teams | Can add two FK fields later if needed |

---

## Implementation Order (Phase 1.5)

1. [ ] Add Performer model to Prisma schema
2. [ ] Add UserPerformerFollow model
3. [ ] Add performerId to Event model
4. [ ] Add followedPerformers relation to User model
5. [ ] Run migration
6. [ ] Create backfill script
7. [ ] Run backfill
8. [ ] Update Event page to show performer link
9. [ ] Build PerformerPopover component
10. [ ] Add performer to search (Phase 1.6)

---

*Simplified design approved. Ready for implementation.*
