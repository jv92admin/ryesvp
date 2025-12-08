# RyesVP — Technical Overview

> **How we build it.** Stack, architecture, data pipeline, and key technical decisions.

For *what* we build and *why*, see `product-vision.md`.

---

## 1. Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 (App Router) | Server components, deployed on Vercel |
| **Database** | PostgreSQL on Supabase | Managed hosting, built-in auth |
| **ORM** | Prisma | Type-safe queries, clean migrations |
| **Auth** | Supabase Auth | Google OAuth only (simplified) |
| **AI** | OpenAI | gpt-4o-mini for classification, gpt-4o for matching |
| **Styling** | Tailwind CSS | Mobile-first, Geist Sans typography |

### Why This Stack

- **Next.js + Vercel:** Fast, serverless, edge-ready. App Router for modern patterns.
- **Supabase:** Managed Postgres with auth built in. Row Level Security for defense-in-depth.
- **Prisma:** Type safety across the stack. Clean migration workflow.
- **Google OAuth only:** Reduces friction. No passwords to manage.

---

## 2. Data Pipeline

How events enter the system and get enriched.

### Event Sources

**Primary: Venue Scrapers**
- Custom scrapers for major Austin venues
- Events upserted with deduplication by source + external ID
- Venues: Moody Center, ACL Live, Stubb's, Paramount Theatre, Long Center, Texas Performing Arts

**Secondary: Ticketmaster Discovery API**
- TM is an enrichment layer, not a primary source
- Daily batch download of all TM events for our venues
- Stored in `TMEventCache` for offline matching

### Enrichment Pipeline

Raw events go through multi-source enrichment:

```
Event Created
    ↓
LLM Classification (gpt-4o-mini)
    → Extract performer name from messy titles
    → Categorize (Concert, Comedy, Theater, Sports, etc.)
    → Generate clean description
    → Confidence score
    ↓
Knowledge Graph Lookup
    → Artist bio, image, Wikipedia link
    → Entity types for category inference
    ↓
Spotify Lookup
    → Artist link, genres, popularity
    → Using LLM-extracted performer name
    ↓
Ticketmaster Matching (gpt-4o)
    → Compare our events vs. TM cache
    → LLM confirmation for ambiguous cases
    → Chain-of-thought prompting for accuracy
    ↓
Enriched Event
```

### What Ticketmaster Provides

| Field | Usage |
|-------|-------|
| `tmUrl` | Direct buy link (main value) |
| `tmEventName` | Display title (if `tmPreferTitle` is true) |
| `tmPresales` | Presale windows |
| `tmAttractions` | Supporting acts |
| `tmGenres` | Genre/classification |
| `tmSeatmapUrl` | Seat map image |
| `tmOnSaleDate` | When tickets go on sale |
| `tmInfo`, `tmPleaseNote` | "Know before you go" content |

**Note:** Price data from Discovery API is unreliable (often null or wrong). We don't display it.

---

## 3. Canonical Data Model

> **displayTitle is computed ONCE at the data layer, never in components.**

See `data-model-101.md` for full conventions.

### Key Types

```typescript
// The canonical event type for UI
type EventDisplay = EventWithVenue & {
  displayTitle: string;           // ALWAYS resolved
  enrichment?: EnrichmentDisplay; // UI subset
  social?: EventSocialSignals;    // Optional
};

// UI subset of enrichment (not all 30+ fields)
type EnrichmentDisplay = {
  spotifyUrl: string | null;
  wikipediaUrl: string | null;
  genres: string[];
  tmUrl: string | null;
};
```

### Display Title Logic

```typescript
displayTitle = enrichment?.tmPreferTitle && enrichment?.tmEventName
  ? enrichment.tmEventName
  : event.title;
```

Computed in data layer. Never in components.

---

## 4. Security

### Row Level Security (RLS)

All 16 tables have RLS enabled. Defense-in-depth (app uses Prisma direct connection, so RLS is backup).

**Helper Functions:**
- `get_user_id()` — Maps `auth.uid()` to `User.id`
- `are_friends(user1, user2)` — Checks ACCEPTED friendship
- `is_squad_member(squad_id, user_id)` — Checks squad membership

**Access Patterns:**

| Table | Policy |
|-------|--------|
| Venue, Event, Enrichment, WeatherCache | Public read-only |
| User | displayName public, email self-only |
| Friendship | Participants only |
| UserEvent | Self + friends |
| List, ListMember | Owner + self |
| InviteCode, InviteRedemption | Self only |
| Squad, SquadMember, SquadPriceGuide, SquadStop | Members access, friends see existence |
| TMEventCache | Service role only |
| Notification | Self only |

---

## 5. Key Technical Decisions

### LLM-First Enrichment

**Problem:** Venue titles are messy ("TAYLOR SWIFT | THE ERAS TOUR - PRESENTED BY..."). Spotify/KG lookups failed on raw titles.

**Solution:** LLM extracts clean performer name first, then targeted lookups.

**Result:** Dramatically improved categorization accuracy and Spotify match rates.

### TM Matching via LLM

**Problem:** Fuzzy title matching alone couldn't resolve "Is 'Taylor Swift | The Eras Tour' the same as 'Taylor Swift'?"

**Solution:** Chain-of-thought LLM prompting (gpt-4o) with venue + date context.

**Result:** High-confidence TM matches without manual review.

### Squad vs. Plan Terminology

**Internal (code):** "Squad" everywhere — database, API routes, file names, types.

**User-facing (UI):** "Plan" everywhere — buttons, modals, notifications, copy.

No refactoring the codebase. Just consistent UI copy mapping.

### Weather Caching

- Cache at (lat, lng, date) level
- 1-hour TTL per entry
- User-triggered (not pre-fetched)
- Google Weather API with `pageSize` param for forecast range

### Notification System

- Database-backed (`Notification` model), not localStorage
- 8 notification types covering friend requests, plan invites, member changes, ticket coverage
- Bell dropdown with unread badge
- Mark-as-read on individual or bulk basis

---

## 6. API Integration Status

| API | Status | Usage |
|-----|--------|-------|
| Ticketmaster Discovery | ✅ Complete | Event enrichment, buy links |
| Google Knowledge Graph | ✅ Complete | Artist info, images, Wikipedia |
| Spotify Web API | ✅ Complete | Artist links, genres |
| Google Weather API | ✅ Complete | Day-of forecasts |
| OpenAI | ✅ Complete | Classification, TM matching |
| SeatGeek | 🔲 Deprioritized | — |
| Google Geocoding | 🔲 Needed | Venue lat/lng backfill |

---

## 7. Scripts

Located in `scripts/`:

| Script | Purpose |
|--------|---------|
| `enrich-events.ts` | Run full enrichment pipeline on events |
| `download-tm-cache.ts` | Batch download TM events for all venues |
| `enrich-tm-from-cache.ts` | Match events to cached TM data |
| `check-tm-enrichment.ts` | Audit TM match status |
| `lookup-tm-venues.ts` | Find TM venue IDs |
| `ingest-offline.ts` | Run scrapers in offline/dev mode |
| `delete-seed-events.ts` | Clean up test data |

---

## 8. File Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # REST endpoints
│   ├── events/[id]/       # Event detail page
│   ├── squads/[id]/       # Squad (Plan) page
│   └── ...
├── components/            # React components
│   ├── ui/               # Shared design system (Button, Badge, etc.)
│   ├── squad/            # Squad-related components
│   └── brand/            # Logo, wordmark
├── db/                    # Data layer (Prisma queries, types)
│   ├── events.ts         # Event queries, EventDisplay type
│   ├── enrichment.ts     # Enrichment queries
│   ├── squads.ts         # Squad queries
│   └── ...
├── lib/                   # Utilities, API clients
│   ├── browser.ts        # Puppeteer launcher (local + serverless)
│   ├── ticketmaster.ts   # TM API client
│   ├── spotify.ts        # Spotify API client
│   ├── weather.ts        # Weather API client
│   └── ...
├── ingestion/            # Venue scrapers
└── middleware.ts         # Supabase SSR session handling

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration history
└── seed.ts              # Dev seed data

scripts/                  # CLI scripts for enrichment, maintenance
```

---

## 9. Scheduled Jobs (Cron)

All jobs run daily on Vercel Cron (staggered 2-6 AM Central).

| Job | Route | Purpose |
|-----|-------|---------|
| Scrape | `/api/cron/scrape` | Run all venue scrapers |
| Enrich | `/api/cron/enrich` | LLM + KG + Spotify enrichment |
| TM Download | `/api/cron/tm-download` | Refresh Ticketmaster cache |
| TM Match | `/api/cron/tm-match` | Match events to TM data |
| Weather | `/api/cron/weather-precache` | Pre-cache weather for upcoming events |

**Authentication:** All routes require `Bearer CRON_SECRET` header.

**Serverless Puppeteer:** 8 scrapers use Puppeteer for JavaScript-heavy sites. On Vercel:
- `@sparticuz/chromium-min` downloads chromium at runtime from GitHub releases
- `puppeteer-core` launches the browser
- `src/lib/browser.ts` abstracts local vs serverless environment detection

---

## 10. Known Technical Debt

| Issue | Impact | Notes |
|-------|--------|-------|
| Venue lat/lng not populated | Weather + Maps links require geocoding | Need script to backfill via Google Geocoding API |
| Weather pre-caching | API calls on every Day-of view | Could pre-cache popular dates |

---

## 11. Schema Gaps (Future Phases)

Models and fields needed for upcoming features. Reference this when starting each phase. Assess data model based on updated knowledge and clarifications with users.

### Phase 4: Create-Your-Own Events

```prisma
// Add to EventSource enum
enum EventSource {
  VENUE_WEBSITE
  TICKETMASTER
  SEATGEEK
  MANUAL
  USER_CREATED  // NEW
}

// Add to Event model
model Event {
  // ... existing fields ...
  createdById   String?       // Host of user-created event
  createdBy     User?         @relation("EventCreator", fields: [createdById], references: [id])
  locationText  String?       // Freeform location for user events (vs venueId)
  visibility    EventVisibility @default(PUBLIC)
}

enum EventVisibility {
  PUBLIC        // Anyone can see
  FRIENDS       // Only friends can see
  INVITE_ONLY   // Only invited people
}
```

### Phase 4: Friend Profiles

```prisma
// Add to User model
model User {
  // ... existing fields ...
  username      String?   @unique  // For /u/alex URLs
  bio           String?            // Short blurb
  avatarUrl     String?            // Optional uploaded avatar
  
  // NEW relation for user-created events
  eventsCreated Event[]  @relation("EventCreator")
}
```

### Phase 5: Artist Foundation

```prisma
// NEW model
model Artist {
  id            String   @id @default(uuid())
  name          String
  spotifyId     String?  @unique
  spotifyUrl    String?
  imageUrl      String?
  bio           String?
  genres        String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  performances  EventPerformer[]
  followers     UserArtistFollow[]
  
  @@index([spotifyId])
  @@index([name])
}

// NEW model - links events to artists
model EventPerformer {
  id        String   @id @default(uuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  artistId  String
  artist    Artist   @relation(fields: [artistId], references: [id], onDelete: Cascade)
  role      PerformerRole @default(HEADLINER)
  sortOrder Int      @default(0)  // For ordering multiple performers
  
  @@unique([eventId, artistId])
  @@index([eventId])
  @@index([artistId])
}

enum PerformerRole {
  HEADLINER
  OPENER
  SUPPORT
  DJ
  HOST
}

// NEW model - user follows artist
model UserArtistFollow {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  artistId  String
  artist    Artist   @relation(fields: [artistId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  
  @@unique([userId, artistId])
  @@index([userId])
  @@index([artistId])
}
```

### Phase 6: Spotify Integration

```prisma
// Add to User model
model User {
  // ... existing fields ...
  spotifyUserId       String?   // Spotify user ID
  spotifyRefreshToken String?   // Encrypted refresh token
  spotifyConnectedAt  DateTime? // When they connected Spotify
}
```

### Phase 7: Communities (Plan → Community Link)

```prisma
// Add to Squad model
model Squad {
  // ... existing fields ...
  communityId   String?       // Optional community this plan belongs to
  community     List?         @relation(fields: [communityId], references: [id])
}

// Add to List model
model List {
  // ... existing fields ...
  imageUrl      String?       // Community branding
  squads        Squad[]       // Plans within this community
}
```

### Backlog Schema Additions

```prisma
// Add to User model
model User {
  // ... existing fields ...
  lastVisitAt   DateTime?     // For "New to You" tracking
}

// Add to Squad model (or create SquadNote)
model Squad {
  // ... existing fields ...
  notes         String?       // Bulletin board / freeform notes
}
```

---

*Last Updated: December 2025*

