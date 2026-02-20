# Fundamental UX Questions

Captured from founder review session. These are architectural, not cosmetic — they could reshape navigation, page structure, and the core loop.

---

## 1. Home Page Doesn't Surface the Social Signal

**Problem:** The primary value prop — "see what your friends are going to" — isn't immediately obvious on the home page. You have to tab to a second tab, and even then the friends view is convoluted with nested grouping.

**The sell is:** "Open the app, instantly see what your crew is doing this week." Right now that takes 2+ taps and cognitive overhead.

**Questions to answer:**
- Should the default home view be social-first (friends' activity) rather than event-grid-first?
- Should friend activity be a persistent layer ON the event feed (badges, avatar stacks) rather than a separate tab?
- Is the two-tab model (Events / Social) the right split, or should it be one unified feed with social signals woven in?

---

## 2. Groups Are Underutilized

**Problem:** Groups exist but don't drive the experience. Friends should see what their groups are doing — "Your running crew has 3 people going to ACL" — but groups are mostly a friend-adding mechanism today.

**Questions to answer:**
- Should groups have their own feed/activity view?
- Should group activity surface on the home page? ("Your group 'Concert Crew' — 4 members interested in Khruangbin")
- Are groups a first-class navigation item, or contextual information layered onto events?

---

## 3. Plan Page Is Boring and Non-Obvious

**Problem:** The plan page has good intent (coordinate logistics) but it's unclear to users that they need to open it or what they should do once there. It feels like a separate dead-end rather than a natural extension of the event.

**Core question:** If you have a plan for an event, why is it a separate route (`/squads/[id]`)? Should the event page itself become "plan-aware" — showing logistics, members, meetup details when you have an active plan?

**Questions to answer:**
- Should plans live ON the event page as a mode/panel rather than a separate page?
- Should creating a plan redirect to an enhanced event page (with plan overlay) rather than a separate squad page?
- What's the minimum viable plan UX? (Maybe: member list + status + meetup details, all visible without navigating away from the event)
- How do we make the plan page feel actionable? What's the clear next step for each member?

---

## 4. (Space for More)

Founder noted "I'm sure I'll think of more" — this doc will grow.

---

## How These Connect to the Revamp

These questions are upstream of everything else:
- **UI polish** depends on knowing what the home page structure will be
- **Engagement** (toasts, notifications) depends on knowing what actions we're driving users toward
- **Scraper ops** is independent — can proceed regardless
- **New integrations** (Spotify, YouTube, ESPN) need to know where their data surfaces in the UI

**Recommended sequence:**
1. Resolve these UX questions (even directionally) before major UI work
2. Scraper/enrichment improvements can proceed in parallel (data layer, not UI-dependent)
3. Engagement improvements should follow UX decisions (copy and triggers change if flows change)
