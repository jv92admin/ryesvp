# RyesVP — Product Vision

> **"The real product is the night out, not the app."**

---

## 1. The Soul

RyesVP is not trying to be a new place to hang out on your phone.

It's a small, opinionated tool that helps people who already like going out:

- **See what's happening** — a clean calendar of events worth knowing about
- **See where their people are orbiting** — friends, communities, shared taste
- **Turn a loose idea into a real plan** — without drowning in group chats

Everything in the product exists to serve that real-world outcome: more people saying "yes," showing up, and having a good time.

### What We Believe

**The real product is the night out, not the app.**
Our job is to make it easier to say "yes," show up, and have a good time — not to maximize minutes spent staring at a feed.

**People already have group chats and socials they love.**
iMessage, WhatsApp, Instagram, Discord… these aren't going away. RyesVP is a layer around those tools, not a replacement.

**Organic, invite-based networks feel better than growth-hacked ones.**
We'd rather have 50 clusters where everyone actually goes to shows together than 50k accounts who half-signed up.

**Meet people where they are.**
If someone lives in SMS and email, we let them participate from SMS and email. If they live in group chats, we give them clean summaries to paste back.

---

## 2. Event Taxonomy

RyesVP is not "all events everywhere." It's:

> **The easiest way for me and my friends to say yes to going out in Austin.**

To support that, we distinguish three event types:

### Large Events — The Anchor

Big shows. Arenas. Major venues. Ticketed concerts, comedy tours, theatre, sports.

**Why they matter:**
- They're the anchor of many nights out
- They're where Squads naturally form
- They're where "Plan the Day" shines — pregame, show, afterparty

**Data source:** Venue website scrapers + Ticketmaster Discovery API

**Product focus:** This is the backbone. It works first. Lowest strategic risk, lowest PM attention needed once solid.

**"New to You" Personalization:**
Events added since your last visit are highlighted. The feed shows you what's genuinely new, not just what's upcoming. This simple signal ("12 new events since Tuesday") keeps the calendar fresh without manufactured urgency.

**Search:**
Find events by artist, venue, or keyword. Search surfaces results with social context attached — "Khruangbin (3 friends going)".

### Hosted Events — Unique Data

Events created and hosted by users:
- Thanksgiving dinner
- Wine night
- Halloween party
- House show
- Watch party
- Birthday

**Why this matters:**
This is where RyesVP stops being "events + social overlay" and becomes **"where my people host and plan nights."**

This is unique data. Nobody else has "wine night at V's place with these 8 friends." This builds true retention and social gravity.

**How Hosted Events differ:**
- **Host-centric:** "Hosted by Maya," not "at Moody Center"
- **Social graph-centric:** Friends, communities, invite-only
- **The event page is the Squad:** No separate planning overlay needed

**Architectural note:** Reuse Squad infrastructure with modifications. A user gets a "personal venue" or one is generated per event. The fundamental feature set for Large Events has to work first — but architectural choices along the way keep Hosted Events in mind.

### Around-Town Events — Future Flavor

Smaller shows at bars, local comedy clubs, indie rooms. Creek & Cave sets, small music stages, neighborhood venues.

**Why they matter:**
- They make the feed feel alive and Austin-specific
- They add "what's happening around town" beyond just big tours

**Why we're waiting:**
- Highest effort / maintenance per unit value (janky sites, IG-only announcements)
- We treat this as curated, not comprehensive
- Architecture doesn't change; scraping is the challenge

**Status:** Acknowledged as future expansion. Not core for now.

---

## 3. The Squad Model

The Squad is the **atomic unit of planning**.

The event page answers: *"What is this, when, and where?"*

The Squad answers: *"Who's actually in, what's the plan, and what do I need to know?"*

### What Squads Hold

- **Who's in / thinking / out** — clear stance from each person
- **Ticket status** — who needs tickets, who has extras, who's buying for others
- **Guests** — +1s, +2s
- **Budget signals** — rough alignment on spend
- **Seat/section info** — lightweight coordination

### Two Windows Into the Squad

**Plan the Event** — Are we going? Who's in? Who needs tickets?
- Member status
- Ticket coordination
- Invite friends to the Squad

**Plan the Day** — What do I need today to actually get there?
- Weather at event time
- "Know before you go" (bag policy, etc.)
- Squad Stops (the itinerary)
- Pinned notes

This keeps pre-event decisions and day-of execution both clean and low-stress.

### Squad Stops — The Itinerary

A lightweight timeline of freeform stops:

```
5:30 — Drinks at Lazarus (link)
7:15 — Walk to Moody Center
8:00 — Show starts
After — Tacos at Tyson's
```

**Design:**
- Each stop is just `time` (optional) + `text` (freeform)
- Users can paste links, add notes, keep it loose
- Auto-arrange by time
- No over-modeling — this is intentionally simple

**Why this matters:**
The "Plan the Day" section becomes the source of truth for time-based messaging:
- Day-of emails
- SMS summaries
- "Here's the plan" exports to group chats

### For Hosted Events

The event page *is* the Squad. You don't need a separate planning overlay — RSVPs, logistics, and coordination are baked into the event itself.

---

## 4. Friends & Communities

### Friends — The First Ring

Friends are the backbone of how people decide to go out. For most people, the question is less "What events exist?" and more:

> "Which of these would be fun with my people?"

**What Friends power:**
- A clear lens over the calendar: events that intersect with people you know
- Simple, high-trust signals: "3 friends going," "2 interested"
- Obvious coordination: who to reach out to, without exposing you to the whole world
- Friends-of-friends discovery: see events where mutual connections are going, creating opportunities to link up

**Philosophy:**
The Friends graph is a lightweight layer that makes nights out easier — not a social network leaderboard. We place "Add Friend" where it unlocks real value (Squads, shared events, invites), not everywhere for its own sake.

### Communities — The Second Ring

Friends are your first ring. Communities are the second ring:

> "People like me, in my city, who like the same types of nights out."

**What Communities enable:**
- Gently expand your circle around shared scenes: "Austin Indie Nights," "East Side Comedy," "Queer Dance Parties"
- Discovery anchored in events, not abstract groups
- A way for early users to shape what RyesVP feels like

**Philosophy:**
Curated, invite-based pockets rather than a giant, anonymous feed. A community feed shows real human signals — who's going, recent events, highlights — not an infinite scroll designed to trap you.

**Self-Moderation (future):**
Community-driven tools for groups to self-govern: report issues, manage membership, maintain positive vibes without heavy-handed platform intervention.

---

## 5. The Ticket Network

A trusted buy/sell layer within your communities and friend graph.

### The Problem It Solves

"Alex needs a ticket" is visible to friends. No marketplace needed — just signal and trust.

### How It Works

- **Friends-of-friends discovery:** Expand the ticket search circle safely
- **Within communities:** Trusted exchange among people who share a scene
- **Soft reputation signals (future):** Did this person actually show up? Simple trust indicators built over time

### Why It's Distinct

The ticket network scales with communities but solves a different problem than coordination. It's about **access and trust** — getting into shows through your people, not through scalpers.

---

## 6. Explore & Playlists

Discovery and curation through music.

### Inside Squads

Create or link a YouTube/Spotify playlist for the event:
- "Here's what we're listening to before the show"
- Shared taste-building before you even get there

### Inside Communities

Community-level playlists curate a scene:
- "Austin Indie Nights playlist"
- Maintained by community members
- Discovery through taste, not just event listings

### On Your Profile

Your playlists as a signal of taste:
- What you're into
- Shows you've been to
- A way to connect with like-minded people

### Artist Following (future)

Follow artists and get notified when they announce Austin shows:
- Connected to Spotify listening history
- "Artists you listen to are coming to town"
- Taste graph that powers smarter recommendations

---

## 7. Comms: Meet Them Where They Are

> "We don't win by trying to pull gravity into RyesVP. We win by fitting around it."

### Export to Group Chats

Clean summaries that paste neatly:
- "Share Plan" → structured text for iMessage/WhatsApp
- "Share Day-of" → logistics snapshot for the morning of

### Reply-by-Email

For people who don't want to log in:
- "You've been added to a Squad — reply with your status"
- We parse the reply, update their status, confirm back
- "Reply YES to confirm you're in"

### Day-of SMS

Reserved for logistics, not marketing:
- "Tonight: [Artist @ Venue]. Plan: 5:30 Drinks → 8:00 Show. Details: [link]"
- Weather alerts if conditions change
- Sent only when there's something to act on

### Calendar Export

One-click export to your calendar:
- Add individual events to Google Calendar / Apple Calendar
- Subscribe to your "Going" events as a live feed
- Squad plans sync to calendars with all logistics attached

### LLM-Powered Intelligence

Turn structured data into human-feeling messages:
- Weather, stops, policies, tickets → a natural-sounding email
- Parse email replies into status updates
- Generate "Share Plan" text that sounds like you wrote it
- Day-of summaries with personality

---

## 8. Data Pipeline

How events enter the system.

### Venue Scrapers

We scrape event data from major Austin venues:
- Moody Center, ACL Live, Stubb's, Paramount Theatre, Long Center, Texas Performing Arts
- Each venue has a dedicated scraper
- Events are upserted with deduplication by source + external ID

### Enrichment Layer

Raw events go through multi-source enrichment:

**LLM Classification:**
- Extract performer name from messy titles
- Categorize event (Concert, Comedy, Theater, Sports, etc.)
- Generate clean descriptions

**Knowledge Graph:**
- Artist bio, image, Wikipedia link
- Entity types for category inference

**Spotify:**
- Artist link, genres, popularity
- One-click "listen before you go"

### Ticketmaster Integration

TM is an enrichment layer, not a primary source:

**Batch Download:**
- Daily download of all TM events for our venues
- Stored in cache table for offline matching

**LLM Matching:**
- Compare our events vs. TM cache
- Fuzzy title matching + LLM confirmation for ambiguous cases
- Resolve "Is 'Taylor Swift | The Eras Tour' the same as 'Taylor Swift'?"

**What TM Provides:**
- Direct buy links (the main value)
- Presale windows
- Supporting acts
- Genre/classification
- High-quality images (fallback)

### Canonical Data Model

**displayTitle:** Computed once at the data layer, never in components. TM title preferred if marked, else venue title.

**Enrichment subset:** UI only gets what it needs (links, genres). Full enrichment (bios, presales, etc.) fetched on demand.

**Social signals:** Friends going, communities attending, user status — attached to events at query time.

---

## 9. Technical Foundation

### Stack

- **Frontend:** Next.js (App Router) on Vercel — fast, serverless, edge-ready
- **Database:** PostgreSQL on Supabase — managed, with built-in auth
- **ORM:** Prisma — type-safe queries, clean migrations
- **AI:** OpenAI (gpt-4o-mini for classification, gpt-4o for matching) — smart enrichment without breaking the bank
- **Auth:** Supabase Auth with Google OAuth — simple, trusted, no password friction

### UI Philosophy

The UI serves the night out. It's not trying to be a destination.

**Principles:**
- **Mobile-first:** Most decisions about going out happen on phones
- **Scannable:** Event cards, friend signals, and plans should be glanceable
- **Fast:** No loading spinners for core flows — optimistic updates, prefetching
- **Exportable:** Everything important can be copied, shared, or sent elsewhere

**Aesthetic:**
- Clean typography (Geist Sans)
- Image-forward event cards
- Visual badges for social signals (friends going, presales, new)
- Subtle, not flashy — the event is the star, not the app

---

## 10. Moonshots

Ideas that push beyond incremental improvements.

### "Plan My Night" — AI-Powered Curation

Start with a show. Get a full night.

> "I'm going to the Khruangbin show at Moody. Plan my evening."

The system suggests:
- Dinner nearby that fits your vibe
- Pregame spot within walking distance
- After-party options based on what's happening that night
- Auto-populates Squad Stops with the itinerary

This isn't about replacing human judgment — it's about removing friction. The AI drafts; you edit.

### Conversational Planning via Text

For people who never want to open the app:
- "Add me to the Khruangbin squad" → parsed and executed
- "What's happening this weekend?" → curated summary via SMS
- "I need 2 tickets for Saturday" → surfaces friends who have extras

LLM-powered intent parsing meets the planning layer. The app becomes invisible for users who prefer text.

### Scaled Scraping Infrastructure

As we add venues, scraping becomes a bottleneck. The vision:

**MCP (Model Context Protocol) Orchestration:**
- Puppeteer-based scrapers that handle JavaScript-heavy venue sites
- LLM-assisted parsing for inconsistent formats
- Self-healing scrapers that adapt when site structures change
- New venue onboarding in hours, not days

**Around-Town at Scale:**
- Instagram parsing for smaller venues
- Community-submitted events with verification
- "Teach the system" flows where users help classify edge cases

### Taste Graph

Your attendance history, playlist activity, and friend overlap build a taste profile:
- "People like you are going to X"
- Artist recommendations based on actual shows attended
- Community suggestions based on scene affinity

Not a filter bubble — a lens that helps you find your people.

---

## 11. Engagement Philosophy

> "Use engagement to support real plans and real relationships — not to manufacture fake urgency."

### What We Surface

Real actions:
- A friend added you
- You were added to a Squad
- The plan changed
- Someone needs a ticket you might have

### What We Don't Do

- Vanity metrics
- "X is also looking at this event"
- Engagement bait
- Notifications that exist to drive opens, not inform

### The Test

Every notification, every nudge, every surface should answer:

> "Would this feel like a helpful nudge to someone who actually likes going out?"

If not, we don't ship it.

---

## 12. What Success Looks Like

Not DAU. Not time-in-app.

**More people saying "yes" to going out.**
The calendar surfaced something they wouldn't have found. Friends made it feel doable.

**More plans that actually happen.**
Squads turned "we should go" into "we went."

**Fewer logistics lost in group chats.**
The structured bits live in RyesVP. The vibes stay in iMessage.

**Organic growth through invites.**
People bring their friends because it makes their nights out better — not because we gamed them into it.

---

*Last Updated: November 2025*

