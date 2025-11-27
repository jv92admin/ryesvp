# UI Polish & Data Enrichment - Feature Ideas

## Overview

This document outlines ideas for improving the user experience through visual polish, smart highlighting, and enriched event data. These features make the app feel more dynamic and informative while helping users discover events that matter to them.

---

## UI Polish Features

### 1. "New Listings" Highlighting

**Problem:** Users can't easily spot newly added events, especially ones that might have presales or early access.

**Solution:** Visual indicators for recently added events.

**Implementation:**
- **"New" Badge** - Show a badge on events added in the last 24-48 hours
- **Presale Indicators** - Highlight events with active presales (if we can detect this)
- **Visual Distinction** - Subtle border highlight or icon to draw attention
- **Filter Option** - Add a "New This Week" filter toggle

**UI Elements:**
```
[Event Card]
┌─────────────────────────────────┐
│ 🆕 NEW  [Presale Active]       │
│                                 │
│ Artist Name                     │
│ Venue • Date                    │
└─────────────────────────────────┘
```

**Technical Approach:**
- Track `createdAt` timestamp for events
- Compare against current time to determine "new" status
- Add CSS classes for visual highlighting
- Consider presale detection from event URLs or descriptions

---

### 2. "New to You" Personalization

**Problem:** Users want to see what's new since their last visit, not just what's new in the system.

**Solution:** Track user's last visit and highlight events added since then.

**Implementation:**
- **Last Visit Tracking** - Store timestamp of user's last page visit
- **"New to You" Badge** - Show badge on events added since last visit
- **"New to You" Filter** - Filter toggle to show only new-to-user events
- **Reset on Visit** - Update last visit timestamp when user views events

**User Flow:**
1. User visits site Monday → sees all events
2. User returns Friday → sees "New to You" badge on events added Tue-Fri
3. User clicks "New to You" filter → shows only those events
4. After viewing, badges clear (or persist until next visit)

**Technical Approach:**
- Add `lastVisitAt` field to User model (optional, nullable)
- Update on page load or event list view
- Query events where `createdAt > user.lastVisitAt`
- Show badge conditionally based on comparison

**Privacy Note:** This is per-user tracking, not shared data. Users can opt out if desired.

---

### 3. Dynamic Event Cards

**Current State:** Event cards feel static and similar.

**Enhancements:**
- **Status Indicators** - Visual indicators for:
  - "Selling Fast" (if we can detect this)
  - "Presale Active"
  - "Friends Going" (show count or avatars)
  - "Group Members Attending"
- **Hover Effects** - Subtle animations on hover
- **Quick Actions** - "Mark Going" button directly on card
- **Image Optimization** - Lazy loading, better image handling

**Visual Hierarchy:**
- Most important info (title, date) prominent
- Social signals (friends going) visible but not overwhelming
- Actions (mark going, share) easily accessible

---

### 4. Smart Event Grouping

**Enhancements:**
- **"This Weekend"** section at top
- **"Friends Going"** section (if user has friends)
- **"Trending"** section (events with most friends/group members)
- **"Presales Starting Soon"** section

**Collapsible Sections:**
- Allow users to expand/collapse date groups
- Remember preferences (localStorage)

---

## Data Enrichment Features

### 1. Artist/Performer Information Mining

**Problem:** Events show artist names but no context about who they are, their music, or where to listen.

**Solution:** Automatically enrich events with artist information from web sources.

**Data to Extract:**
- **Artist Bio** - Brief description (1-2 sentences)
- **Genre** - Music genre or performance type
- **Spotify Link** - Link to artist's Spotify profile
- **YouTube Link** - Link to artist's YouTube channel or popular videos
- **Social Links** - Instagram, Twitter/X, Facebook (if available)
- **Image** - Artist photo/logo (if event image is missing)

**Sources:**
- **Google Knowledge Graph** - Structured data about artists
- **Spotify API** - Artist info, genres, links
- **YouTube Data API** - Channel info, popular videos
- **MusicBrainz** - Open music database
- **Wikipedia** - Fallback for artist bios

**Implementation Approach:**
1. **Extract Artist Names** - Parse event titles to identify artist/performer names
   - Pattern matching: "Artist Name at Venue"
   - Handle multiple artists: "Artist A & Artist B"
   - Handle support acts: "Headliner with Support Act"

2. **Artist Database** - Create `Artist` model to store enriched data
   ```prisma
   model Artist {
     id          String   @id @default(uuid())
     name        String   @unique
     bio         String?
     genre       String?
     spotifyId   String?
     spotifyUrl  String?
     youtubeUrl  String?
     imageUrl    String?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     
     events      Event[]
   }
   ```

3. **Enrichment Process**:
   - When new event is added, extract artist name
   - Check if artist exists in database
   - If not, query external APIs to get info
   - Store enriched data
   - Link event to artist

4. **Fallback Strategy**:
   - Try Spotify API first (most reliable)
   - Fall back to Google search/Knowledge Graph
   - Use Wikipedia for bios
   - Cache results to avoid repeated API calls

**UI Integration:**
- Show artist info on event detail page
- Links to Spotify/YouTube for listening
- "Similar Artists" suggestions (future)
- Artist profile pages (future)

---

### 2. Event Notes & Context

**Problem:** Events lack context that helps users decide (e.g., "this is a reunion tour", "first time in Austin", "sold out last year").

**Solution:** Add a `notes` field that can be populated from various sources.

**Data Sources:**
- **Event Descriptions** - Extract key info from venue descriptions
- **Web Scraping** - Scrape additional context from venue pages
- **Manual Curation** - Allow manual notes (future: community-sourced)

**Types of Notes:**
- Tour information: "Part of 2025 World Tour"
- Special events: "Reunion Show", "Farewell Tour"
- Venue context: "Intimate Setting", "Outdoor Venue"
- Historical context: "First Austin Show Since 2019"
- Pricing hints: "Tickets Starting at $X" (if available)

**Implementation:**
- Add `notes` field to Event model (text field)
- Populate during scraping when available
- Display on event detail page
- Consider markdown support for formatting

---

### 3. Smart Category Enhancement

**Current:** Basic categories (CONCERT, COMEDY, THEATER, SPORTS, FESTIVAL, OTHER)

**Enhancements:**
- **Subcategories** - More granular categories:
  - CONCERT → Rock, Pop, Country, Jazz, Electronic, Hip-Hop, etc.
  - COMEDY → Stand-up, Improv, Sketch, etc.
  - SPORTS → Basketball, Football, Soccer, etc.
- **Auto-detection** - Use artist genre data to auto-assign subcategories
- **Filter by Subcategory** - Allow filtering by more specific categories

**Implementation:**
- Add `subcategory` field to Event model
- Use Spotify genre data to infer subcategory
- Fall back to text analysis of event title/description

---

### 4. Related Events Discovery

**Problem:** Users find one event they like but don't know about similar events.

**Solution:** Show related events based on artist, genre, or venue.

**Logic:**
- **Same Artist** - Other shows by the same artist
- **Similar Genre** - Events in same genre/subcategory
- **Same Venue** - Other events at the same venue
- **Friends' Interests** - Events friends are going to in similar categories

**UI:**
- "You might also like" section on event detail page
- "Similar Events" carousel
- "More at this Venue" section

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ "New Listings" badge (24-48 hour window)
2. ✅ "New to You" tracking (last visit timestamp)
3. ✅ Enhanced event card visuals
4. ✅ Add `notes` field to Event model

### Phase 2: Data Enrichment (2-3 weeks)
1. ✅ Create Artist model
2. ✅ Implement artist name extraction from event titles
3. ✅ Integrate Spotify API for artist data
4. ✅ Display artist info and links on event pages
5. ✅ Add YouTube link extraction

### Phase 3: Advanced Features (3-4 weeks)
1. ✅ Google Knowledge Graph integration (fallback)
2. ✅ Subcategory system
3. ✅ Related events discovery
4. ✅ Presale detection
5. ✅ "Trending" and smart grouping

---

## Technical Considerations

### API Rate Limits
- **Spotify API** - 10,000 requests/day (free tier)
- **YouTube API** - 10,000 units/day (free tier)
- **Google Knowledge Graph** - 100,000 requests/day (free tier)

**Strategy:**
- Cache artist data aggressively (don't re-fetch for same artist)
- Batch API calls where possible
- Use fallback sources if primary source fails
- Consider paid tiers if usage grows

### Performance
- **Lazy Loading** - Load artist data on event detail page, not list page
- **Caching** - Cache enriched data to avoid repeated API calls
- **Background Jobs** - Run enrichment asynchronously after event ingestion
- **Progressive Enhancement** - App works without enriched data, enhanced when available

### Privacy & Data
- **User Tracking** - Last visit tracking is opt-in (or clearly disclosed)
- **External Links** - Spotify/YouTube links open in new tabs
- **Data Accuracy** - Handle cases where artist info is wrong or missing gracefully

---

## UI Mockups / Wireframes

### Event Card with Enhancements
```
┌─────────────────────────────────────┐
│ 🆕 NEW  [3 Friends Going]            │
├─────────────────────────────────────┤
│ [Event Image]                        │
│                                      │
│ Artist Name                          │
│ 🎵 Rock • 🎤 Concert                 │
│                                      │
│ Venue Name                           │
│ 📅 Friday, Jan 15 at 8:00 PM        │
│                                      │
│ [🎵 Spotify] [▶️ YouTube] [Going →] │
└─────────────────────────────────────┘
```

### Event Detail Page Enhancements
```
┌─────────────────────────────────────┐
│ Event Title                          │
│ 🆕 NEW TO YOU                       │
├─────────────────────────────────────┤
│ [Large Event Image]                 │
│                                      │
│ Artist: Artist Name                  │
│ 🎵 Rock • 🎤 Concert                 │
│                                      │
│ [🎵 Listen on Spotify]              │
│ [▶️ Watch on YouTube]                │
│                                      │
│ 📍 Venue Name                        │
│ 📅 Date & Time                       │
│                                      │
│ About This Event:                    │
│ [Notes/Description]                  │
│                                      │
│ You Might Also Like:                 │
│ [Related Events Carousel]            │
└─────────────────────────────────────┘
```

---

## Success Metrics

- **Engagement:** Users click on "New to You" events more than regular events
- **Discovery:** Users discover new artists through Spotify/YouTube links
- **Retention:** Users return more frequently to see "new to you" content
- **Data Quality:** Percentage of events with enriched artist data

---

**Last Updated:** January 2025  
**Status:** Planning Phase - Ready for Implementation

