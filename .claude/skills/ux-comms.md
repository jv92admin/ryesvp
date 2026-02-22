# UX & Communications

You are working on user-facing copy, toasts, notifications, share texts, onboarding, or email templates.

## Design Authority for Copy

All user-facing text has a source of truth. If you need copy that doesn't exist in this file, **flag it to the design-director agent** — don't write placeholder text and ship it. Copy is a design decision.

**Visual styling of copy elements** (toast colors, button styles, chip states) is NOT decided here. See `/lark-design-system` for all visual specs and `/ui-system` for implementation patterns. This file owns *what we say*. The design system owns *how it looks*.

## Lark Voice

> "The friend who always knows about the show before you do. Not loud, not tryhard — just naturally plugged in and always down to go."

The voice is confident but never corporate. Warm but never bubbly. Informed but never lecturing. Think: the person in the group chat who drops the link before anyone else knew the show was happening.

### Product Language

| Word | Role | Example |
|------|------|---------|
| Lark | The platform | "I found it on Lark." |
| Plan | The thing you create & share | "I made a plan for Saturday." |
| on Lark | How you reference it | "Who's on Lark for Saturday?" |

**Code naming note:** Code says "Squad" internally (models, routes, DB tables). Users **never** see "squad." This is a hard rule — grep for it before shipping any user-facing string. The migration from "squad" → "plan" in internal naming is ongoing; when you touch a file, rename where feasible.

### Copy Principles

- **Highlight the social graph** — "your people", "friends", "crew", "together"
- **Sound like a friend, not software** — "Something's happening on Lark" not "New notification received"
- **Celebratory toasts** — "Plan created! 3 friends invited." not "Squad successfully created."
- **Title Case for CTAs** — "Start Plan", "Add Friends", "View Your Events"
- **Sentence case for body** — "Mark events as going or interested"
- **No emoji in UI chrome** — only as visual anchors in share texts (use sparingly)
- **No exclamation marks in navigation or labels** — exclamation marks are okay in toasts and celebrations, never in headers, buttons, or metadata
- **Avoid the word "event" in user-facing UI** — prefer "show", "night", or the specific category. "Event" is what Eventbrite says. "Show" is what people say.

## Copy by Surface

These are canonical. Use them verbatim — don't rephrase.

| Surface | Copy |
|---------|------|
| Search bar placeholder | "What kind of night are we having?" |
| Hero / body | "Find something, bring your people." |
| Hero variant | "Plans with your people, not your inbox." |
| Primary tagline | "Lark — nights start here." |
| Tagline variant (warm) | "Lark — see you out there." |
| Tagline variant (active) | "Lark — start the night." |
| Tagline variant (insider) | "Lark — find the room." |
| Empty state (no events) | "Nights start here. Begin by following a few venues or friends." |
| Empty state (no friends) | "Add a few friends to see who's going." |
| Empty state (solo plan) | "Plans are better with friends! Invite someone to join you." |
| CTA buttons | "Find Something Tonight" / "Plan with Your People" |
| Share link | "Friday at Mohawk — via Lark" |
| Push notification | "2 friends are in for Saturday on Lark" |
| Notification (generic) | "Something's happening on Lark." |
| Loading / skeleton | *(no text — skeleton screen only, see design system)* |
| Error (inline) | "Couldn't load. Pull to retry." |

### Section Headers

Section headers use `--type-micro` (11px), uppercase, `--text-secondary`. These are the canonical labels:

| Section | Header |
|---------|--------|
| Active plans strip | YOUR PLANS |
| Today's events | TODAY |
| Upcoming events | THIS WEEK / THIS WEEKEND |
| Category filter bar | *(no header — chips are self-evident)* |
| Plan member list | MEMBERS |
| Plan RSVP section | YOUR PLAN |

**Not** "My Plans", "Upcoming", "Events Today", or any variation.

## Onboarding — "On a Lark" Moment

Single hero screen shown once on first launch. Sets the emotional promise before the user sees any events.

**Headline:** "Let's go on a lark."
**Definition:** *lark / lärk / noun: a spontaneous adventure. The kind of unplanned night that turns into the best story.*

This appears ONCE. Never in marketing copy, notifications, push messages, or UI. One moment, one screen, one feeling. After this screen, the app opens to the discovery feed.

## Toast Inventory

All toast messages are defined here. Don't invent new toast copy without adding it to this table.

| Context | Scenario | Message |
|---------|----------|---------|
| Plan creation | With friends | `Plan created! {N} friend(s) invited and notified.` |
| Plan creation | Solo | `Plan created! Add friends to start planning together.` |
| Plan creation | Joined existing | `You joined {friendName}'s plan!` |
| Plan invite | 1 friend | `{friendName} has been added to your plan and notified.` |
| Plan invite | 2 friends | `{name1} and {name2} have been added to your plan and notified.` |
| Plan invite | 3+ friends | `{N} friends have been added to your plan and notified.` |
| Calendar | Google | `Opening Google Calendar...` |
| Calendar | Apple/Outlook | `Calendar event downloaded!` |
| Share | Clipboard | `Copied to clipboard!` |
| First engagement | Going/Interested | Title: `Added to Your Events` — CTA: `View Your Events →` |

**Implementation:** `useToast()` from `src/contexts/ToastContext.tsx`. Toast component renders in `--bg-elevated` with `--border-subtle` border (see design system for full visual spec). Single toast at a time, 8s auto-dismiss.

## Notification Types (9)

All stored in DB, display text computed server-side in `getNotificationText()` — **never** in components. If you need a new notification type, add it to the DB enum and the server-side text function first.

| Type | Template |
|------|----------|
| `FRIEND_REQUEST_RECEIVED` | `{actor} sent you a friend request.` |
| `FRIEND_REQUEST_ACCEPTED` | `{actor} accepted your friend request.` |
| `ADDED_TO_PLAN` | `{actor} added you to their plan for {event} on {date}.` |
| `PLAN_CANCELLED` | `Your plan for {event} on {date} was cancelled.` |
| `PLAN_MEMBER_JOINED` | `{actor} joined your plan for {event}.` |
| `PLAN_MEMBER_LEFT` | `{actor} left your plan for {event}.` |
| `TICKET_COVERED_FOR_YOU` | `{actor} is handling your ticket for {event} on {date}.` |
| `PLAN_MEETUP_CREATED` | `Meetup added for your {event} plan: {message}.` |
| `GROUP_MEMBER_JOINED` | `{actor} joined {groupName}.` |

## Share Text Families (5)

All must render cleanly in iMessage, WhatsApp, and SMS — no markdown, clean line breaks, emoji only as visual anchors. Share links use `lark.show` domain.

1. **Personal friend invite** — "Add me on Lark so we can spot Austin shows and actually make plans to go. lark.show/invite/{code}"
2. **Group invite** — URL-only clipboard with modal explanation copy. "lark.show/group/{slug}"
3. **Event share** (logged-in / logged-out variants) — Event details + referral link. "lark.show/{event-slug}"
4. **Plan share** (3 variants: buying-for-others / has-tickets / interested) — Context-aware logistics. "lark.show/plan/{id}"
5. **Day-of share** — Tonight details: time, meeting spot, who's going, plan link.

Templates live in `src/lib/share.ts` and `src/lib/squadShareText.ts` (rename to `planShareText.ts` when touched).

## Key References

| File | Purpose |
|------|---------|
| `notes/reference/customer-comms.md` | Full copy template library |
| `/lark-design-system` skill | Visual specs for toast, badge, notification UI |
| `/engagement` skill | Full notification/toast/share system with wiring details |
| `.claude/agents/design-director.md` | Escalation point for new copy needs |
| `src/components/ui/Toast.tsx` | Toast component |
| `src/db/notifications.ts` | 9 notification types, display text computation |
| `src/lib/share.ts` | Native share API (mobile) with clipboard fallback (desktop) |
| `src/lib/squadShareText.ts` | Plan share text templates (rename pending) |
| `src/contexts/ToastContext.tsx` | Toast provider + `useToast()` hook |
