# Data Enrichment Specification

> **See also:** `PROJECT-ROADMAP.md` for overall project priorities

## Overview

Data enrichment automatically gathers context about events from the web, helping users decide if they want to attend. Instead of building specific integrations for each event type, we use a general approach that works across music, comedy, speakers, sports, and more.

**Core Principle:** Let enrichment inform category, not the other way around.

---

## Goals

1. **Help users decide** - "Who is this? Should I go?"
2. **Universal approach** - Works for any event type
3. **Improve data quality** - Enrichment corrects category detection
4. **Async processing** - Don't slow down ingestion
5. **Graceful degradation** - No enrichment = no problem, just show less

---

## Data Sources

### Primary: Google Knowledge Graph API

**What:** Structured data about entities (people, shows, brands, organizations).

**Why:** Universal - works for musicians, comedians, speakers, sports teams, shows.

**Free Tier:** 100,000 requests/day

**Example Request:**
```
GET https://kgsearch.googleapis.com/v1/entities:search
  ?query=John+Mulaney
  &key=API_KEY
  &limit=1
  &types=Person
```

**Example Response:**
```json
{
  "itemListElement": [{
    "result": {
      "@type": ["Person", "Thing"],
      "name": "John Mulaney",
      "description": "American comedian",
      "detailedDescription": {
        "articleBody": "John Edmund Mulaney is an American stand-up comedian, actor, and writer...",
        "url": "https://en.wikipedia.org/wiki/John_Mulaney"
      },
      "image": {
        "contentUrl": "https://..."
      },
      "url": "https://en.wikipedia.org/wiki/John_Mulaney"
    },
    "resultScore": 1456.7
  }]
}
```

**What We Extract:**
- `name` - Canonical name
- `description` - Short description
- `detailedDescription.articleBody` - Longer bio (truncate)
- `image.contentUrl` - Image URL
- `url` - Wikipedia or official link
- `@type` - Entity type (for category inference)
- `resultScore` - Confidence score

---

### Secondary: Spotify API (Music Only)

**What:** Artist data, genres, and playback links.

**Why:** For music events, adds "Listen on Spotify" functionality.

**Free Tier:** 10,000 requests/day (with rate limiting)

**When to Use:**
- Knowledge Graph returns music-related type
- OR Knowledge Graph is ambiguous/no result
- Opportunistically try Spotify for unknowns

**Example Request:**
```
GET https://api.spotify.com/v1/search
  ?q=Deadmau5
  &type=artist
  &limit=1
```

**Example Response:**
```json
{
  "artists": {
    "items": [{
      "id": "2CIMQHirSU0MQqyYHq0eOx",
      "name": "deadmau5",
      "genres": ["electro house", "progressive electro house"],
      "popularity": 72,
      "images": [{"url": "https://..."}],
      "external_urls": {
        "spotify": "https://open.spotify.com/artist/2CIMQHirSU0MQqyYHq0eOx"
      }
    }]
  }
}
```

**What We Extract:**
- `id` - Spotify artist ID
- `name` - Artist name (for validation)
- `genres` - Array of genres
- `popularity` - Score 0-100 (for confidence)
- `external_urls.spotify` - Link to Spotify profile
- `images[0].url` - Artist image

---

## Keyword Extraction

The tricky part: extracting searchable keywords from event titles.

**Common Patterns:**

| Event Title | Keywords to Extract |
|-------------|---------------------|
| "Deadmau5" | "Deadmau5" |
| "Deadmau5 at Moody Center" | "Deadmau5" |
| "An Evening with Willie Nelson" | "Willie Nelson" |
| "John Mulaney: Baby J Tour" | "John Mulaney" |
| "Austin Symphony: Beethoven's 5th" | "Austin Symphony" or "Beethoven" |
| "Monster Jam" | "Monster Jam" |
| "Texas vs Oklahoma" | "Texas Longhorns", "Oklahoma Sooners" |

**Extraction Strategy:**

1. **Remove venue name** from title (we know the venue)
2. **Remove common phrases:**
   - "at [Venue]"
   - "An Evening with"
   - "Live in Austin"
   - ": [Tour Name]"
   - "presents"
3. **Handle featuring/support:**
   - "Artist A with Artist B" → Extract both, primary first
   - "Artist A feat. Artist B" → Extract both
4. **Clean up:**
   - Remove dates, ticket info, parentheticals
   - Trim whitespace

**Implementation:**

```typescript
// src/enrichment/keywordExtractor.ts

const REMOVE_PATTERNS = [
  /\s+at\s+.+$/i,           // "at Moody Center"
  /^an evening with\s+/i,   // "An Evening with"
  /\s*:\s*.+tour.*/i,       // ": Baby J Tour"
  /\s*live\s*(in)?\s*.*/i,  // "Live in Austin"
  /\s*presents?\s*/i,       // "presents"
  /\([^)]*\)/g,             // (anything in parens)
  /\[[^\]]*\]/g,            // [anything in brackets]
];

const SPLIT_PATTERNS = [
  /\s+with\s+/i,            // "A with B"
  /\s+feat\.?\s+/i,         // "A feat. B"
  /\s+featuring\s+/i,       // "A featuring B"
  /\s+&\s+/,                // "A & B"
  /\s+and\s+/i,             // "A and B" (careful with band names)
];

export function extractKeywords(title: string, venueName?: string): string[] {
  let cleaned = title;
  
  // Remove venue name if present
  if (venueName) {
    cleaned = cleaned.replace(new RegExp(venueName, 'gi'), '');
  }
  
  // Apply remove patterns
  for (const pattern of REMOVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Split on featuring patterns
  let keywords = [cleaned.trim()];
  for (const pattern of SPLIT_PATTERNS) {
    keywords = keywords.flatMap(k => k.split(pattern).map(s => s.trim()));
  }
  
  // Filter empty and too short
  return keywords.filter(k => k.length > 2);
}
```

**Note:** This is heuristic-based and won't be perfect. That's OK - we're enriching, not requiring.

---

## Category Inference

Use Knowledge Graph `@type` to infer/correct event category:

| Knowledge Graph @type | Inferred Category |
|----------------------|-------------------|
| `MusicGroup` | CONCERT |
| `MusicRecording` | CONCERT |
| `MusicAlbum` | CONCERT |
| `Musician` | CONCERT |
| `Person` + music context | CONCERT |
| `Comedian` | COMEDY |
| `SportsTeam` | SPORTS |
| `SportsEvent` | SPORTS |
| `TheaterEvent` | THEATER |
| `TheaterGroup` | THEATER |
| `Festival` | FESTIVAL |
| `Organization` | Keep existing |
| Unknown / None | Keep existing |

**Spotify as confirmation:** If Spotify returns a match with popularity > 30, that's strong evidence it's music.

**Implementation:**

```typescript
function inferCategory(
  kgTypes: string[], 
  kgDescription: string,
  spotifyMatch: SpotifyArtist | null
): EventCategory | null {
  // Check KG types
  if (kgTypes.some(t => ['MusicGroup', 'MusicRecording', 'Musician'].includes(t))) {
    return 'CONCERT';
  }
  if (kgTypes.includes('Comedian')) {
    return 'COMEDY';
  }
  if (kgTypes.some(t => ['SportsTeam', 'SportsEvent'].includes(t))) {
    return 'SPORTS';
  }
  if (kgTypes.some(t => ['TheaterEvent', 'TheaterGroup', 'Play'].includes(t))) {
    return 'THEATER';
  }
  
  // Check description for hints
  const desc = kgDescription?.toLowerCase() || '';
  if (desc.includes('comedian') || desc.includes('comedy')) return 'COMEDY';
  if (desc.includes('band') || desc.includes('musician') || desc.includes('singer')) return 'CONCERT';
  
  // Spotify match is strong evidence of music
  if (spotifyMatch && spotifyMatch.popularity > 30) {
    return 'CONCERT';
  }
  
  return null; // Don't change
}
```

---

## Data Model

```prisma
model Enrichment {
  id            String   @id @default(uuid())
  eventId       String   @unique
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  // Search metadata
  searchQuery   String   // What we searched for
  
  // Knowledge Graph data
  kgEntityId    String?  // Knowledge Graph entity ID (for caching)
  kgName        String?  // Canonical name
  kgDescription String?  // Short description
  kgBio         String?  @db.Text // Longer bio
  kgImageUrl    String?
  kgWikiUrl     String?
  kgTypes       String[] // Array of @type values
  kgScore       Float?   // Result score (confidence)
  
  // Spotify data
  spotifyId     String?  // Spotify artist ID
  spotifyName   String?  // Artist name from Spotify
  spotifyUrl    String?  // Link to Spotify profile
  spotifyGenres String[] // Array of genres
  spotifyPopularity Int? // 0-100 popularity score
  spotifyImageUrl String?
  
  // Inferred data
  inferredCategory EventCategory? // Category we think it should be
  categoryUpdated  Boolean @default(false) // Did we update the event category?
  
  // Meta
  status        EnrichmentStatus @default(PENDING)
  errorMessage  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([eventId])
  @@index([status])
  @@index([kgEntityId])
  @@index([spotifyId])
}

enum EnrichmentStatus {
  PENDING     // Not yet processed
  PROCESSING  // Currently being enriched
  COMPLETED   // Successfully enriched
  PARTIAL     // Some sources worked, others didn't
  FAILED      // All sources failed
  SKIPPED     // Intentionally skipped (e.g., no keywords)
}

// Add relation to Event model
model Event {
  // ... existing fields
  enrichment Enrichment?
}
```

---

## Enrichment Pipeline

### Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Enrichment Pipeline (runs nightly or on-demand)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. GET EVENTS TO PROCESS                                        │
│    - No enrichment record, OR                                   │
│    - Enrichment status = PENDING/FAILED and retryable           │
│    - Limit batch size (e.g., 50 per run)                        │
│                                                                 │
│ 2. FOR EACH EVENT:                                              │
│                                                                 │
│    a. EXTRACT KEYWORDS from title                               │
│       - Remove venue, common phrases                            │
│       - Split on "with", "feat.", etc.                          │
│       - If no keywords → mark SKIPPED                           │
│                                                                 │
│    b. QUERY KNOWLEDGE GRAPH                                     │
│       - Search for primary keyword                              │
│       - Extract: name, bio, image, types, score                 │
│       - If no result → continue to Spotify anyway               │
│                                                                 │
│    c. DECIDE IF SPOTIFY NEEDED                                  │
│       - KG type is music-related → YES                          │
│       - KG type is clearly non-music (Comedian) → NO            │
│       - KG ambiguous or no result → YES (opportunistic)         │
│                                                                 │
│    d. QUERY SPOTIFY (if needed)                                 │
│       - Search for primary keyword                              │
│       - Check popularity > threshold for confidence             │
│       - Extract: id, url, genres, image                         │
│                                                                 │
│    e. INFER CATEGORY                                            │
│       - Based on KG types and Spotify match                     │
│       - If different from event.category → update event         │
│                                                                 │
│    f. SAVE ENRICHMENT RECORD                                    │
│       - Store all extracted data                                │
│       - Set status: COMPLETED, PARTIAL, or FAILED               │
│                                                                 │
│ 3. LOG SUMMARY                                                  │
│    - X events processed                                         │
│    - Y enriched, Z failed, W skipped                            │
│    - Categories updated: N                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limiting

- **Knowledge Graph:** 100K/day → ~4K/hour → ~70/minute
- **Spotify:** Varies, but ~30 requests/second is safe

For 300 events, we're well within limits. Add delays between requests to be respectful:

```typescript
const DELAY_BETWEEN_EVENTS_MS = 500; // 0.5 seconds
const DELAY_BETWEEN_REQUESTS_MS = 100; // 0.1 seconds
```

---

## Implementation Phases

### Phase 1: Knowledge Graph Integration (2-3 hours)

**Goal:** Basic enrichment for all event types.

**Tasks:**
1. Set up Google Cloud project, enable Knowledge Graph API
2. Add `GOOGLE_API_KEY` environment variable
3. Create Enrichment model and migration
4. Implement keyword extraction
5. Implement Knowledge Graph client
6. Create enrichment job script (`scripts/enrich-events.ts`)
7. Display enrichment on event detail page (bio, image, Wikipedia link)

**Deliverables:**
- Events show bio and image from Knowledge Graph
- Category updated based on KG types
- Can run manually: `npx tsx scripts/enrich-events.ts`

### Phase 2: Spotify Integration (2 hours)

**Goal:** Add "Listen on Spotify" for music events.

**Tasks:**
1. Register Spotify Developer app
2. Add Spotify credentials to environment
3. Implement Spotify API client (with auth flow)
4. Add Spotify lookup to enrichment pipeline
5. Display "Listen on Spotify" button on event detail
6. Show genres on event cards/detail

**Deliverables:**
- Music events have Spotify links
- Genres displayed
- Spotify match improves category detection

### Phase 3: Scheduled Enrichment (1 hour)

**Goal:** Run enrichment automatically.

**Tasks:**
1. Create API route: `POST /api/enrich` (protected)
2. Set up cron job (Vercel cron or external)
3. Run nightly at 4 AM
4. Add logging/monitoring

**Deliverables:**
- New events automatically enriched within 24 hours

### Phase 4: Enrichment for Existing Events (30 min)

**Goal:** Backfill existing events.

**Tasks:**
1. Run one-time enrichment on all existing events
2. Review results, adjust keyword extraction if needed
3. Fix any category mismatches

---

## API Endpoints

### Enrichment Job Trigger

```
POST /api/enrich
  Headers: { Authorization: Bearer CRON_SECRET }
  Body: { limit?: number, force?: boolean }
  
  Response: {
    processed: number,
    enriched: number,
    failed: number,
    skipped: number,
    categoriesUpdated: number
  }
```

### Get Enrichment for Event

```
GET /api/events/[id]/enrichment

Response: {
  enrichment: Enrichment | null
}
```

This is usually included in the event detail response, not called separately.

---

## UI Integration

### Event Detail Page

```tsx
// When enrichment exists:
<div className="bg-gray-50 rounded-lg p-4 mt-6">
  <div className="flex gap-4">
    {enrichment.kgImageUrl && (
      <img 
        src={enrichment.kgImageUrl} 
        alt={enrichment.kgName}
        className="w-24 h-24 rounded-lg object-cover"
      />
    )}
    <div>
      <h3 className="font-semibold">{enrichment.kgName}</h3>
      <p className="text-sm text-gray-600 mt-1">{enrichment.kgDescription}</p>
      
      {enrichment.spotifyGenres?.length > 0 && (
        <div className="flex gap-1 mt-2">
          {enrichment.spotifyGenres.slice(0, 3).map(genre => (
            <span key={genre} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
              {genre}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex gap-3 mt-3">
        {enrichment.spotifyUrl && (
          <a href={enrichment.spotifyUrl} target="_blank" className="...">
            🎵 Listen on Spotify
          </a>
        )}
        {enrichment.kgWikiUrl && (
          <a href={enrichment.kgWikiUrl} target="_blank" className="...">
            📖 Wikipedia
          </a>
        )}
      </div>
    </div>
  </div>
</div>
```

### Event Card (Optional)

Show genres as small badges:
```tsx
{event.enrichment?.spotifyGenres?.slice(0, 2).map(genre => (
  <span key={genre} className="text-xs text-gray-500">
    {genre}
  </span>
))}
```

---

## Environment Variables

```bash
# Google Knowledge Graph
GOOGLE_API_KEY=your_google_api_key

# Spotify
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Enrichment job auth
ENRICHMENT_SECRET=random_secret_for_cron
```

---

## Caching & Deduplication

### Artist-Level Caching

Many events feature the same artists. Cache at the artist level:

```prisma
model ArtistCache {
  id            String   @id @default(uuid())
  searchQuery   String   @unique // Normalized query
  
  // Cached data
  kgEntityId    String?
  kgData        Json?    // Full KG response
  spotifyId     String?
  spotifyData   Json?    // Full Spotify response
  
  createdAt     DateTime @default(now())
  expiresAt     DateTime // e.g., 30 days
  
  @@index([searchQuery])
}
```

Before querying APIs, check cache:
```typescript
const cached = await prisma.artistCache.findUnique({
  where: { searchQuery: normalizedQuery }
});

if (cached && cached.expiresAt > new Date()) {
  return cached; // Use cached data
}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Knowledge Graph rate limit | Retry after delay |
| Knowledge Graph no result | Mark as PARTIAL, continue to Spotify |
| Spotify rate limit | Retry after delay |
| Spotify auth expired | Refresh token, retry |
| Spotify no result | Mark as PARTIAL or COMPLETED |
| Network error | Mark as FAILED, retry next run |
| Invalid response | Log error, mark as FAILED |

**Retry Strategy:**
- Failed enrichments retry on next run
- Max 3 retries before marking as permanently failed
- Exponential backoff for rate limits

---

## Success Metrics

- **Coverage:** % of events with enrichment
- **Accuracy:** Spot-check category corrections
- **Usage:** Do users click Spotify/Wikipedia links?
- **Performance:** Enrichment job completes in reasonable time

---

## Out of Scope (Future)

- **YouTube integration** - Could add later for video content
- **AI-generated summaries** - "This artist is known for..."
- **Reddit/social aggregation** - Complex, legal questions
- **Manual curation interface** - Let admins edit enrichment
- **User-contributed enrichment** - Community corrections

---

**Last Updated:** November 2024
**Status:** Core Implementation Complete

---

## Implementation Status

### ✅ Completed

| Phase | What | Notes |
|-------|------|-------|
| Phase 1 | Knowledge Graph Integration | Bio, image, Wikipedia links, category inference from @type |
| Phase 2 | Spotify Integration | Artist links, genres for music events. Stricter matching to avoid false positives. |
| Phase 4 | Backfill Existing Events | 230 events processed. 61 fully enriched, 96 partial, 73 no matches. |
| - | MOVIE category | Added to handle films correctly (was incorrectly showing as THEATER) |
| - | Event Card Badges | Spotify/Wikipedia icons on cards, click through to external sites |
| - | Event Detail Enrichment | Full enrichment section on event pages |

### 🔲 Pending: LLM-First Enrichment Refactor

The current approach (keyword extraction → KG → Spotify) has limitations:
- KG returns wrong entities without context ("Couch" band → furniture wiki)
- Generic events fail ("Gospel Brunch", "Texas WBB")
- Sports/local events miscategorized

**New Approach: LLM-First with Targeted API Lookups**

```
┌─────────────────────────────────────────────────────────────────┐
│ LLM-FIRST ENRICHMENT FLOW                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. LLM CATEGORIZATION (always run - ~$0.02 per 250 events)     │
│    Input:                                                       │
│      - Event title                                              │
│      - Venue name + city                                        │
│      - Date                                                     │
│      - Event description (from scrape)                          │
│      - Source URL                                               │
│      - Current category (venue's guess)                         │
│    Output:                                                      │
│      - category: CONCERT | COMEDY | THEATER | MOVIE | SPORTS    │
│      - performer: "artist name" or null                         │
│      - description: "1-2 sentence context for attendees"        │
│      - confidence: high | medium | low                          │
│                                                                 │
│ 2. TARGETED API LOOKUP (based on LLM output)                   │
│    - CONCERT → Spotify search (use performer name from LLM)     │
│    - COMEDY → KG search with "comedian" type hint               │
│    - THEATER/MOVIE → KG search with show/film hint              │
│    - SPORTS → Skip API (LLM description sufficient)             │
│                                                                 │
│ 3. STORE COMBINED RESULTS                                       │
│    - LLM description (always available)                         │
│    - Spotify link + genres (if music)                           │
│    - Wikipedia link (if KG match)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why LLM First?**
- Understands context: "Couch at Stubb's" = band, not furniture
- Handles edge cases: "Texas WBB at Moody" = Women's Basketball
- Always provides description (no more empty enrichment)
- Guides targeted API lookups (better accuracy)

**The Prompt:**
```
You categorize events for a concert discovery app in Austin, TX.

Event: "${title}"
Venue: ${venueName} (${city})
Date: ${date}
Description: ${description || "none"}
Source URL: ${url}

Respond in JSON only:
{
  "category": "CONCERT" | "COMEDY" | "THEATER" | "MOVIE" | "SPORTS" | "FESTIVAL" | "OTHER",
  "performer": "artist/performer name or null",
  "description": "1-2 sentence description for someone deciding whether to attend",
  "confidence": "high" | "medium" | "low"
}
```

**Cost Estimate (GPT-4o-mini):**
- ~200 input + 100 output tokens per event
- 250 events ≈ $0.02 per batch
- Essentially free at our scale

**Implementation Tasks:**

| Step | What | Time |
|------|------|------|
| 1 | Add OpenAI/Gemini client | 30 min |
| 2 | Create LLM enrichment function | 30 min |
| 3 | Update enrichment script to LLM-first flow | 30 min |
| 4 | Use LLM performer name for targeted Spotify/KG | 20 min |
| 5 | Add `llmDescription` field to Enrichment model | 10 min |
| 6 | Test on problem events (Couch, Texas WBB) | 20 min |

**Total: ~2-3 hours**

---

### Future: External APIs (After LLM Refactor)

| Source | Good For | Notes |
|--------|----------|-------|
| **Ticketmaster Discovery API** | Event categories, images | Free tier, fuzzy match on title+venue+date |
| **SeatGeek API** | Similar to Ticketmaster | Free tier |
| **MusicBrainz** | Comprehensive music DB | Free, open source |
| **Last.fm** | Artist info, similar artists | Free |

These could validate/enhance LLM output but add complexity. Evaluate after LLM-first is working.

---

### Artist Caching (After LLM Refactor)

`ArtistCache` model exists in spec. Wire up to reduce API calls for repeat artists. More valuable once LLM provides accurate performer names.

---

### Scheduled Enrichment (After LLM Refactor)

Cron job for scraping + enrichment. See `/notes/scheduled-jobs-spec.md`.

---

### Known Issues (Current System)

1. **Generic queries fail**: Events like "Gospel Brunch", "Texas WBB" don't have good KG matches
2. **Context blindness**: KG doesn't know venue context ("Couch" at Stubb's = band)
3. **Spotify opportunistic search removed**: Now only searches if KG indicates music

**LLM-first approach addresses all of these.**

### Running Enrichment (Current)

```bash
# Enrich new events only
npx tsx scripts/enrich-events.ts --limit=50

# Re-enrich all events (force)
npx tsx scripts/enrich-events.ts --force --limit=250
```


