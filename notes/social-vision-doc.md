# RyesVP Social Vision Document

**Version:** 1.0  
**Last Updated:** November 29, 2025  
**Audience:** Product, Business, Design

---

## Executive Summary

RyesVP transforms how friends plan nights out together. We're not building another messaging app—we're building the **pre-chat coordination layer** that makes group planning effortless.

**The core insight:** Planning a night out is chaotic. The fun part is going out with friends. The painful part is figuring out who's in, what everyone wants to spend, who's buying tickets, and where you're meeting. That coordination happens in messy group chats today. We make it structured, visual, and shareable.

**Value proposition in one line:**
> "See what's happening. See where your friends are going. Actually get a plan together."

---

## The Problem We're Solving

### Today's Reality

When a group of friends wants to go to a concert together:

1. **Someone finds an event** on Instagram, a venue website, or word of mouth
2. **They text the group chat:** "Anyone down for Tame Impala on Saturday?"
3. **Chaos ensues:**
   - 50 messages fly by while someone was at work
   - Half the group says "maybe" but never commits
   - Someone asks "what's the budget?" three times
   - The planner has to manually track who's in
   - Someone buys tickets, another person forgets to pay them back
   - Day-of: "Wait, where are we meeting?"
4. **Result:** Either the plan falls apart, or one exhausted "social organizer" does all the work

### The Pain Points

| Who | Their Pain |
|-----|------------|
| **The Organizer** | Has to repeatedly ask "who's in?" and track responses manually |
| **The Casual Friend** | Scrolls back through 200 messages to find the event link and time |
| **The Budget-Conscious** | Never knows if this is a $30 or $130 night until it's too late |
| **The Late Responder** | Misses the ticket window because info was buried in chat |

### Why Existing Tools Don't Solve This

- **Group chats (iMessage, WhatsApp):** Great for conversation, terrible for state tracking
- **Calendar apps:** Personal, not social—you can't see friends' plans
- **Event apps (Eventbrite, etc.):** Transactional—no coordination layer
- **Social media:** Discovery-focused, not planning-focused

---

## Our Solution: Three Social Layers

RyesVP provides three distinct social layers, each serving a different purpose:

### Layer 1: Friends Network

**What it is:** Your trusted social graph of people you actually go out with.

**Why it matters:** 
- You can see what your friends are interested in or going to
- "3 friends are interested in this event" is a signal to coordinate
- Foundation for everything else

**How users experience it:**
- Add friends by email or invite link
- See friend activity on event cards ("Alex and 2 others are going")
- Profile shows: events together, common interests

### Layer 2: Squads ("Go Together" Rooms)

**What it is:** A lightweight planning room for one specific event with a specific group of friends.

**Why it matters:**
- Replaces the "who's in? what's the budget? who has tickets?" dance
- One glance shows everyone's status
- Generates ready-to-paste summaries for your group chat

**How users experience it:**
- Tap "Go Together" on any event to create a Squad
- Set your status: In / Out / Thinking
- Set your budget preference: <$50 / $50-100 / $100+
- Set your ticket status: Not bought / Buying own / Buying for others
- See at a glance: who's committed, who needs to decide, who's buying tickets
- Share a clean summary back to your group chat

**What a Squad is NOT:**
- Not a full messaging app (keep conversations in your existing chats)
- Not a ticketing platform (we link to where you buy)
- Not overly complicated (3 taps to update status)

### Layer 3: Communities (Future)

**What it is:** Larger groups organized around scenes, vibes, or interests.

**Why it matters:**
- Helps you discover events through people with similar taste
- "This event is trending in Austin Indie Music"
- Over time, some community members become friends

**How users experience it:**
- Join communities like "East Side Comedy" or "Warehouse Parties"
- See events popular in your communities
- Eventually: trusted ticket exchange within communities

---

## The Social Tab: Your Planning Radar

We're replacing the generic "activity feed" with a purpose-built **Social Tab** that answers one question:

> "What's actually happening with my friends?"

### Three Sections, Zero Duplication

**Rule:** Any event appears at most once in the Social Tab. All signals aggregate onto one card.

#### Section A: Your Plans
Events you're committed to or actively coordinating.

- Events where you have a Squad
- Events where you're marked "Going"
- Shows: Squad summary, who's in, ticket status

**User job:** "What am I doing, and what's the status?"

#### Section B: Almost Plans
Events that could easily become plans with one more tap.

- You're Interested AND at least one friend is Interested/Going
- No Squad exists yet
- Shows: "You + 2 friends are interested" + [Go Together] button

**User job:** "What could I do with friends if I just reached out?"

#### Section C: Ticket Activity
Ticket-related signals from your network.

- Friends who Need Tickets for upcoming events
- Friends who Have Tickets (extras to share/sell)
- Eventually: Community-level ticket board

**User job:** "Who needs help getting a ticket? Who has extras?"

---

## Ticket Statuses: A Simple but Powerful Addition

We're adding two new statuses beyond "Interested" and "Going":

| Status | Meaning | Signal Value |
|--------|---------|--------------|
| **Interested** | On my radar | "This person might want to go" |
| **Going** | Committed | "This person is going" |
| **Need Tickets** | Actively looking | "This person wants to go but needs a ticket" |
| **Have Tickets** | Has extras | "This person might sell/share a ticket" |

**Why this matters:**
- High-signal states that enable coordination
- "Priya needs tickets" is an invitation: "I have a spare, I'll reach out"
- Creates natural opportunities for friends to help each other

**What we're NOT building:**
- A ticket marketplace
- Payment processing
- Price enforcement
- Ratings/reviews of sellers

Instead: A trusted bulletin board. "My friend needs a ticket. I have one. We'll figure it out."

---

## The Squad Room: Where Planning Happens

### What Users See

```
┌─────────────────────────────────────────┐
│ 🎵 Tame Impala                          │
│ Sat, Dec 14 · 8:00 PM · Moody Center    │
│ Your Squad · 5 friends                  │
├─────────────────────────────────────────┤
│ YOUR STATUS                             │
│ ┌─────────┬─────────┬─────────┐         │
│ │ Thinking│   In    │   Out   │         │
│ └─────────┴─────────┴─────────┘         │
│ Budget: [ <$50 ] [ $50-100 ] [ $100+ ]  │
│ Tickets: [ Not bought ] [ Buying own ]  │
├─────────────────────────────────────────┤
│ SQUAD SNAPSHOT                          │
│ 5 invited · 3 In · 1 Thinking · 1 Out   │
│ 2 have tickets · 1 buying for 2 more    │
│ ████████░░░░ 3/5 committed              │
├─────────────────────────────────────────┤
│ LOGISTICS                               │
│ Meet: 7:30 PM                           │
│ Where: Lazarus Brewing, East 6th        │
├─────────────────────────────────────────┤
│ [Share Plan]        [Share Day-of]      │
└─────────────────────────────────────────┘
```

### The Power Feature: Share Plan

One tap generates a perfectly formatted message to paste into your group chat:

**If you're buying tickets for others:**
> "I'm organizing Tame Impala on Sat. Budget is around $75-100. I'm grabbing tickets for people who are in by Thu 7pm. Mark your status here: [link] and send me your Venmo!"

**If you're buying your own:**
> "Thinking of Tame Impala on Sat (budget $50-100). If you're in, mark it and grab a ticket so we can coordinate: [link]"

This is the **bridge** between RyesVP and your existing group chats. We don't replace texting—we make texting about plans much cleaner.

---

## User Journeys

### Journey 1: The Organizer

Alex is the "social organizer" of his friend group. He's exhausted from herding cats.

1. Alex sees Tame Impala on the RyesVP calendar
2. Notices "3 friends interested" badge
3. Taps "Go Together" → Creates a Squad
4. Sets himself as "In" with budget "$50-100" and "Buying for others"
5. Taps "Share Plan" → Copies text to clipboard
6. Pastes into his group chat
7. Friends click link → Join Squad → Set their status
8. Alex sees at a glance: 4 in, 1 still thinking
9. Buys 4 tickets, sets deadline for the last person
10. Day-of: Sets meet time + spot, taps "Share Day-of"
11. Everyone shows up. Easy.

**Before RyesVP:** 50 texts, constant "who's in?" messages, manual tracking.  
**With RyesVP:** One link, visual status, auto-generated summaries.

### Journey 2: The Casual Friend

Priya is in Alex's group but doesn't plan things herself.

1. Gets a text from Alex with a RyesVP link
2. Opens link → Sees event + Squad status
3. Taps "In" and "$50-100" (2 taps total)
4. Done. Priya is counted, Alex knows she's in.
5. Day-of: Opens Squad link → Sees "Meet at 7:30 at Lazarus"

**Before RyesVP:** Scrolls through 50 texts to find the event, time, and meeting spot.  
**With RyesVP:** One link has everything.

### Journey 3: The Ticket Seeker

Sam sees a show is sold out but his friends are going.

1. Marks status as "Need Tickets" on the event
2. His friends see: "Sam needs tickets"
3. One friend has an extra → DMs Sam → Done

**Before RyesVP:** Posts "anyone have an extra?" in a group chat, gets lost.  
**With RyesVP:** Visible intent, friends can help.

---

## Edge Cases & How We Handle Them

### One User, One Squad Per Event

**Scenario:** Alex creates a Squad with his college friends. His coworker also creates a Squad for the same event.

**Our approach:**
- A user can only be in ONE Squad per event
- If Alex is invited to the coworker's Squad, we block: "You already have a Squad for this event"
- Future: Allow switching squads or multi-squad membership

**Why:** Prevents confusion, keeps status tracking clean.

### Ghost Town Social Tab

**Scenario:** New user with no friends opens Social Tab.

**Our approach:**
- Section A: "You haven't made any plans yet. Mark events as Going to see them here."
- Section B: "Add friends to see what they're interested in."
- Section C: "Connect with friends to see ticket activity."

**Why:** Empty states should guide the user to the next action.

### Stale Squad Data

**Scenario:** People set status once and never update. Organizer can't trust the data.

**Our approach:**
- Design for this reality: Assume organizer is the only disciplined person
- "Share Plan" text is the real value—works even with partial data
- Don't block features on perfect data

**Why:** People are lazy. We accept that and still deliver value.

### Ticket Exchange Abuse

**Scenario:** Scalpers use "Have Tickets" to offload overpriced tickets.

**Our approach (for now):**
- Invite-only app with friend-of-friend trust
- No payment processing = no marketplace incentives
- Community moderation for bad actors
- Future: Soft reputation ("Member since 2025, 42 events tracked")

**Why:** Keep it social, not transactional.

---

## What We're NOT Building

| Feature | Why Not |
|---------|---------|
| **In-app messaging** | Group chats exist. We augment them, not replace them. |
| **Ticket marketplace** | Attracts scalpers, requires payments infra, not our core value. |
| **Star ratings** | Too formal. Soft reputation (tenure, activity) is enough. |
| **Seat selection** | Not our job. Link to Ticketmaster/venue for that. |
| **Event posting** | We scrape venues. Users don't create events. |

---

## Success Metrics

### Leading Indicators

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Squads created per week | Growing | Core feature adoption |
| "Share Plan" copies per Squad | >1 | Bridge to real coordination |
| Friends added per user | >3 | Network health |
| Return visits to Social Tab | >2x/week | Habit formation |

### Lagging Indicators

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Events attended (Going → actual) | Track | Real-world value delivered |
| Ticket exchanges facilitated | Track | Trust network working |
| Referral rate | >20% | Organic growth |

---

## Phased Rollout

### Phase 0: Ticket Statuses ✅ Complete
Add Need Tickets / Have Tickets to event statuses. Surface in event detail.

### Phase 1: Social Tab + Squads (Current)
Replace sidebar with Social Tab. Add Squad rooms. "Go Together" flow.

### Phase 2: Communities Reimagined
Ticket boards per community. Community moderation. Discovery features.

### Phase 3: Soft Reputation
Profile enhancements. Relationship context. Trust signals.

---

## The North Star

We're not building a social network. We're building **the planning layer for going out with friends.**

The measure of success isn't daily active users or time in app. It's:

> Did more people successfully go out with their friends because RyesVP made planning easier?

If the answer is yes, we're winning.

---

## Appendix: One-Liner Descriptions

**For a friend asking "What's RyesVP?"**
> "It's an app that shows you what's happening in Austin and helps you actually go with your friends instead of just talking about it."

**For a PM describing the product:**
> "A citywide event calendar with a social layer—you see where friends are going and can spin up lightweight planning rooms to coordinate."

**For an investor:**
> "We're building the coordination layer for live events. Think Splitwise for planning nights out—structured, social, and not trying to replace your group chat."

**For a user onboarding screen:**
> "Discover events. See where your friends are going. Plan together without the chaos."

---

**Document Owner:** Product  
**Next Review:** After Phase 1 ships

