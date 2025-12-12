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

We recognize three distinct event types, each with different characteristics and strategic focus:

### Large Events — The Backbone

Big shows. Arenas. Major venues. Ticketed concerts, comedy tours, theatre, sports.

**Why they matter:**
- They're the anchor of many nights out
- They're where Plans naturally form
- They're where "Plan the Day" shines — pregame, show, afterparty
- They're the least controversial to source and easiest to keep accurate

**Product focus:** This is the backbone. Already working. Lowest strategic risk, lowest PM attention needed once solid.

### Medium Events — "Around Town" (Future)

Smaller shows at bars, local comedy clubs, indie rooms. Creek & Cave sets, small music stages, neighborhood venues.

**Why they matter:**
- They make the feed feel alive and Austin-specific
- They add "what's happening around town" beyond just big tours
- They support the "go deep in Austin" thesis

**Realistic tradeoffs:**
- Highest effort/maintenance per unit value (janky sites, IG-only announcements)
- Medium reward — nice flavor, but not the primary reason people use RyesVP

**Strategy:** Curated, not comprehensive. A small, opinionated list of culturally relevant venues. V2+ enhancement once core flows are solid.

### People-Created Events — The Big Bet

Events fully created and hosted by users:
- Thanksgiving dinner
- Wine night
- Halloween party
- House show
- Watch party
- Birthday
- "Let's try this new bar"
- Brunch, poker night, game night

**Why this is a strategic focus:**
This is where RyesVP stops being "events + social overlay" and becomes **"where my people host and plan nights."**

This is unique data. Nobody else has "wine night at V's place with these 8 friends." This builds true retention and social gravity.

**The unlock:** It makes "Start a Plan" useful even when the catalog doesn't have the thing. It reduces the "empty shelf" feeling when scraped listings don't match what people actually want to do this weekend.

**How they differ:**
- **Host-centric:** "Hosted by Maya," not "at Moody Center"
- **Social graph-centric:** Friends, communities, invite-only
- **The event page is the Plan:** No separate planning overlay needed — RSVPs, logistics, and coordination are baked into the event itself

**Minimum viable create-event:**
- Title
- Date/time
- Location (text + optional map search)
- Optional URL (Ticketmaster, restaurant link, whatever)
- Description / notes

**Positioning:** We're happy to compete in the Partiful space. We differentiate by tying into existing friends/plans, living in the same ecosystem as big shows, and reusing our planning and comms stack.

**Priority:** This is a near-term unlock, not a "someday" feature.

---

## 3. The Plan Model

The Plan (internally: "Squad") is the **atomic unit of coordination**.

The event page answers: *"What is this, when, and where?"*

The Plan answers: *"Who's actually in, what's the logistics, and what do I need to know?"*

### What Plans Hold

**Who's in:**
- Status: Yes / Maybe / No
- Clear stance from each person

**Tickets:**
- Have/Getting vs. Need
- "Cover others" — who's buying for whom
- Squad-level price guide (crowdsourced ticket info)

**Guests:**
- +1, +2, or more
- Tracked at the person level

**Day-of Logistics:**
- Itinerary (Squad Stops): freeform timeline of pregame, show, afterparty
- Weather forecast for event day
- "Know before you go" info (bag policy, etc.)
- Quick actions (Maps, Uber)

### Two Modes: Plan vs. Day-of

**Plan Mode** — Are we going? Who's in? Who needs tickets?
- Member status and tickets
- Invite friends
- Price guide

**Day-of Mode** — What do I need today to actually get there?
- Itinerary
- Weather
- Venue info
- Quick links

This keeps pre-event decisions and day-of execution both clean and low-stress.

### Entry Points — "Start a Plan"

The core loop of the app is starting a plan. We surface this action in multiple places:

**From Events:**
- On event cards: Going/Interested buttons that morph into "Start Plan" / "Join Plan"
- On event detail page: Prominent "Start Plan" CTA

**From People:**
- From your own profile: Start a plan → pick event + friends
- From a friend's profile: Start a plan with them pre-selected
- From friend icon/avatar popover: "Start plan with X"

**Global:**
- Persistent "Start a Plan" button (header, FAB, or profile)
- Works even without an event selected (pick event later, or create your own)

**Philosophy:** Make the core loop easy. Every surface should make it obvious how to turn "I want to do something" into an actual plan with friends.

### Squad Stops — The Itinerary

A lightweight timeline of freeform stops:

```
5:30 — Drinks at Lazarus
7:15 — Walk to Moody Center
8:00 — Show starts
After — Tacos at Tyson's
```

**Design:**
- Each stop is `time` (optional) + `label` + `notes` (optional)
- Users can add locations, paste links, keep it loose
- Auto-arrange by time
- Intentionally simple — not a calendar app

**Why this matters:**
The itinerary becomes the source of truth for time-based messaging and exports.

---

## 4. Friends & Communities

### Friends — The First Ring

Friends are the backbone of how people decide to go out. For most people, the question is less "What events exist?" and more:

> "Which of these would be fun with my people?"

**What Friends power:**
- A lens over the calendar: events that intersect with people you know
- Simple, high-trust signals: "3 friends going," "2 interested"
- Obvious coordination: who to reach out to
- Friends-of-friends discovery: see events where mutual connections are going

**Philosophy:**
The Friends graph is a lightweight layer that makes nights out easier — not a social network leaderboard. We place "Add Friend" where it unlocks real value (Plans, shared events, invites), not everywhere for its own sake.

### Friend Profiles

A minimal profile makes "start a plan from a friend" and "add friend" feel real.

**What a friend profile shows:**
- Name + photo
- Short blurb / username (optional)
- "Add friend" or "Friends since…"
- Their upcoming events / plans (what they're going to)
- Mutual friends

**Entry points:**
- Tap on friend avatar/name anywhere → profile
- Popover on hover (desktop): "Start plan with X", "View profile"

**Philosophy:** Profiles exist to facilitate plans, not to be destinations. Keep them minimal and action-oriented.

### Communities — The Second Ring

Friends are your first ring. Communities are the second ring:

> "People like me, in my city, who like the same types of nights out."

**What Communities enable:**
- Gently expand your circle around shared scenes: "Austin Indie Nights," "East Side Comedy"
- Discovery anchored in events, not abstract groups
- A way for early users to shape what RyesVP feels like

**Philosophy:**
Curated, invite-based pockets rather than a giant, anonymous feed.

---

## 5. Ticket Signals

A lightweight layer for ticket coordination within your network.

### The Problem It Solves

"Alex needs a ticket" is visible to friends. No marketplace needed — just signal and trust.

### Ticket Statuses

Users can signal their ticket situation:
- **Have/Getting** — I'm covered
- **Need** — Looking for a ticket
- **Covered** — Someone in my Plan is buying for me

### Within Plans

- See who needs tickets at a glance
- "Cover others" flow: Mark that you're buying for specific people
- Squad-level price guide: Crowdsourced info on what tickets cost

### Future: Ticket Network

- Friends-of-friends discovery: Expand the ticket search circle safely
- Within communities: Trusted exchange among people who share a scene
- Soft reputation signals: Did this person actually show up?

---

## 6. Explore & Discovery

### Performers as Entities

Performers are first-class objects in the data model, not just event metadata.

**What is a Performer?**
The term "performer" encompasses anyone who is the *reason* you go to an event:
- **Artists** — musicians, bands, DJs
- **Comedians** — stand-up, improv troupes
- **Teams** — sports teams, leagues
- **Companies** — theater groups, orchestras, dance companies
- **Hosts** (future) — users who create and host their own events

This framing is intentional. It lets us build one system that handles "follow your favorite band" and "follow Austin FC" with the same mechanics.

**Why this matters:**
- Enables "follow performer" → get notified when they're in Austin
- Powers personalized discovery ("Artists you listen to are coming to town")
- Links events to performers cleanly
- Foundation for Spotify integration (for music artists)
- Foundation for ESPN/sports data (for teams)
- Future: User-hosted events where the *host* is the performer

**What a Performer holds:**
- Name, image, bio
- Type (artist, comedian, team, company, etc.)
- Tags (genres, styles, leagues — universal across types)
- External links (Spotify for artists, team pages for sports)
- Events they're performing at
- Followers (users who follow this performer)

**Performer profiles:**
- Click performer name on event page → modal with bio, image, past/upcoming shows
- Full performer page (future): deeper profile, all Austin history, follow button

### Music Discovery

**On Event Pages:**
- One-click "Listen on Spotify" to preview artists
- Artist info, genres, images when available

**Future — Inside Plans:**
- Create or link a playlist for the event
- "Here's what we're listening to before the show"
- Shared taste-building before you even get there

### Event Discovery

**Search:**
- Find events by performer, venue, genre, or keyword
- Typo-tolerant ("artic" finds "Arctic Monkeys")
- Results surface with social context: "Khruangbin (3 friends going)"
- Search placeholder teaches the feature: `"Bill Burr", "dreampop", or "Sports"...`

**Filters:**
- Quick date chips: Today, This Week, Weekend
- Category chips: Concerts, Comedy, Theater, Sports
- Discovery chips: New listings, Presales
- All filters instant-apply, no "Apply" button

**"New to You" Signals:**
- Events added in last 48 hours highlighted with ✨ New badge
- The feed shows what's genuinely new, not just what's upcoming
- Simple signal keeps the calendar fresh without manufactured urgency

**Future — Performer Following:**
- Follow performers and get notified when they're in Austin
- Connected to listening history (for artists via Spotify)
- Taste graph that powers smarter recommendations

---

## 7. Engagement & Communications

> "We don't win by trying to pull gravity into RyesVP. We win by fitting around it."

### The Seven Principles

These rules govern every notification, email, SMS, and nudge we build:

1. **Real-world plans > app time.**
   The goal of engagement is *better nights out with people you care about*, not raw time-in-app. If a touchpoint doesn't make someone's planning or experience meaningfully better, we don't ship it.

2. **UI first, channels as escalations.**
   Default: all activity is visible and actionable inside RyesVP (feeds, plan pages, notification bell). Email and SMS exist to *extend* access when you're not in the app, not to replace the core UX.

3. **No empty or bait notifications.**
   Every notification must be tied to something concrete: a friend action, an event you're attached to, a meaningful change to a plan. No generic "we miss you, come back" pings. No vanity metrics. No "X is also looking at this event."

4. **Respect the user's current channel.**
   If we ask you to do something in email, you should be able to complete that action *in email* (e.g., reply "I'm in, need 1 ticket" and we parse it). We invite into the app for richer context, but don't force it for simple actions.

5. **We are not a messaging app.**
   No full chat/DM system. No attempt to replace WhatsApp/iMessage/Discord. Any "notes" UX we add (Plan notes, event notes) is for **sticky, shared context**, not live chatter.

6. **SMS is last-mile, not a social channel.**
   SMS is for "you are going somewhere soon; this will help you right now." No SMS for friend requests, invites, or general engagement. Day-of logistics only.

7. **Organic discovery over dark patterns.**
   We make the most of organic moments ("I clicked a link / got invited / got an email"). But we do not build loops whose only purpose is to maximize clicks or opens.

### The Test

Every notification, every nudge, every surface should answer:

> **"Would this feel like a helpful nudge to someone who actually likes going out?"**

If not, we don't ship it.

---

### Channel: In-App

The *canonical brain* of RyesVP. If you open the app, you can see and act on everything important.

**Notification Bell:**
- Friend requests sent/accepted
- Added to a Plan
- Plan member joined/left
- Ticket coverage updates ("Alex is handling your ticket")
- Meaningful changes to plans you're in

**Toast Notifications (Ephemeral Feedback):**
- Instant confirmation when you take action
- Light backgrounds, bold text, 8-second duration
- "Plan created! 2 friends invited and notified."
- Optional copy-link action for easy sharing
- Actor sees toast; recipients see bell notification
- Think confirmation, not alert

**Feeds & Discovery:**
- Event calendar with social signals
- "Friends going to…" overlays
- Communities and scenes

**Plan Pages:**
- Structured state (Going/Maybe/Out, tickets, guests)
- Plan Notes: "Bringing my dad + 1 friend", "Host says BYOB", "Aiming for GA floor"
- Think bulletin board, not chat

---

### Channel: Export to Group Chats

Clean summaries that paste neatly into iMessage/WhatsApp:
- **"Share Plan"** → Invite text with event + who's in + link
- **"Share Day-of"** → Logistics snapshot: meetup time, itinerary, weather

---

### Channel: Email (Future)

**Squad/Event Invitations:**
- Clear summary: event, who's involved, key details
- **Reply-to-act:** Reply with "I'm in, need 1 ticket" → we parse and update your status
- Confirmation email closes the loop

**Weekly Digest (optional):**
- Events this week involving your friends/plans
- "Just listed" items matching your tastes
- Frames us as "your weekly heads up" — not a firehose

**Social Graph Summaries:**
- Batched: friend requests, community invites, new plans
- Only when you've been inactive and have meaningful activity waiting

---

### Channel: SMS (Future)

Reserved for day-of logistics only:
- "Tonight: [Event]. Plan: 5:30 Drinks → 8:00 Show"
- Weather alerts if conditions change
- Critical last-minute changes (venue, time)

Not for: friend requests, community invites, engagement bait.

---

### Channel: Shared Links & Deep Links

Handle organic discovery without being a wall.

**Event Links:**
- Land directly on event page (mobile web or app)
- Show the event first, lightly introduce the broader product
- "This is an event on RyesVP — see who's going, or just use it as a clean event page"

**Plan Invite Links:**
- Land on Plan preview: event info, who's in, CTA to join
- Simple and non-ceremonial

**Philosophy:** Keep "I clicked a link" moments feeling organic, not sales-y. Show the object first, explain later.

---

### Calendar Export

One-click export to your calendar:
- Add individual events to Google/Apple Calendar
- Subscribe to your "Going" events as a live feed

---

## 8. Moonshots

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
- "Add me to the Khruangbin plan" → parsed and executed
- "What's happening this weekend?" → curated summary via SMS
- "I need 2 tickets for Saturday" → surfaces friends who have extras

### Taste Graph

Your attendance history, playlist activity, and friend overlap build a taste profile:
- "People like you are going to X"
- Artist recommendations based on actual shows attended
- Community suggestions based on scene affinity

Not a filter bubble — a lens that helps you find your people.

---

## 9. What Success Looks Like

Not DAU. Not time-in-app.

**More people saying "yes" to going out.**
The calendar surfaced something they wouldn't have found. Friends made it feel doable.

**More plans that actually happen.**
Plans turned "we should go" into "we went."

**Fewer logistics lost in group chats.**
The structured bits live in RyesVP. The vibes stay in iMessage.

**Organic growth through invites.**
People bring their friends because it makes their nights out better — not because we gamed them into it.

---

## 10. Current Capabilities (December 2025)

### What's Built and Working

| Capability | Status |
|------------|--------|
| Event calendar (17 venue scrapers) | ✅ Live |
| Event enrichment (images, Spotify, genres, Ticketmaster) | ✅ Live |
| Performer entity & modal profiles | ✅ Live |
| Friends & friend requests | ✅ Live |
| Communities (basic) | ✅ Live |
| Ticket status signals (Have/Need) | ✅ Live |
| Plans (Squads) with invites | ✅ Live |
| Plan member status (Yes/Maybe/No) | ✅ Live |
| Cover others / ticket coordination | ✅ Live |
| Guests (+1, +2) | ✅ Live |
| Squad-level price guide | ✅ Live |
| Day-of mode with itinerary | ✅ Live |
| Weather forecast | ✅ Live |
| In-app notifications | ✅ Live |
| Invite codes & auto-friend | ✅ Live |
| Share Plan / Share Day-of exports | ✅ Live |
| Async jobs (daily scrape, enrich, TM match) | ✅ Live |
| Row Level Security | ✅ Live |

### What's Next (Priority Order)

| Phase | Capability | Notes |
|-------|------------|-------|
| Now | Discovery & Filters redesign | Chip-based filters, search, no Apply button |
| Next | Basic emails | Welcome, "added to plan", reminders |
| Next | Engagement & onboarding | First-run experience, empty states |
| Later | Create-your-own events | User-hosted events (Partiful lane) |
| Later | Performer following | Get notified when followed performers come to town |
| Later | Spotify OAuth | Top artists → personalized recommendations |
| Later | Communities reimagined | Plans within communities |

---

*Last Updated: December 2025*
