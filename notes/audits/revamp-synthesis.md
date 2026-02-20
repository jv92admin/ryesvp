# Revamp Synthesis

> Cross-referencing: 4 agent audits + planning inventory + founder UX questions.
> Date: 2026-02-19

---

## The Core Tension

The roadmap says: Transactional Emails → Bug Fixes → User Testing → Enrichment.

But three founder UX questions challenge the underlying information architecture:
1. **Home page buries the social signal** — the primary value prop takes 2+ taps to see
2. **Groups don't drive the experience** — they're a friend-adding mechanism, not an engagement driver
3. **Plan page is a dead-end** — separate route feels boring and non-obvious, not a natural extension of the event

These are upstream of everything. Inviting 20-30 users to test the current experience will surface these problems expensively. Fix the architecture first, then test.

---

## Proposed Sequencing (6 Layers)

### Layer 0: Foundation Fixes (no dependencies, parallelizable)

Quick wins that fix bugs, remove debt, and establish the constants layer. Can all run simultaneously.

| # | Task | Agent | Effort | Impact |
|---|------|-------|--------|--------|
| 0.1 | Fix timezone bugs in 6 scrapers (Moody Center, Emo's, Scoot Inn, Radio East, Long Center, Concourse Project) | scraper-ops | 2-3h | Events showing wrong times in production |
| 0.2 | Create `src/lib/constants/` (externalBrands, categoryColors, statusColors) | ui-polish | 2h | Unblocks all component deduplication |
| 0.3 | Replace 8 `alert()` calls with toast system | engagement | 1h | Jarring UX for every error path |
| 0.4 | Fix "check the squad!" → "check the plan!" in squadShareText.ts | engagement | 5min | User-visible brand violation |
| 0.5 | Fix CommunitySoonStub (stale "Early 2025" date, fake email form) | engagement | 30min | Product looks abandoned |
| 0.6 | Fix `bg-emerald-500` → `bg-[var(--brand-primary)]` (2 files) | ui-polish | 10min | Wrong green showing |
| 0.7 | Fix `text-blue-600` → `text-[var(--brand-info)]` (5 files) | ui-polish | 15min | Color mismatch |
| 0.8 | Remove dead scraper code (parseEmosDate, unused imports, unreachable break) | scraper-ops | 30min | Code hygiene |

**Total Layer 0:** ~7h of parallelizable work. All quick wins, zero risk.

---

### Layer 1: Data Quality (scraper-ops focus, independent of UI work)

Improve what we capture before we invest in new integrations. Can run parallel to Layer 2.

| # | Task | Agent | Effort | Impact |
|---|------|-------|--------|--------|
| 1.1 | Antone's: add door time + age + price (same TicketWeb platform as Stubb's) | scraper-ops | 15min | Highest-value quick win |
| 1.2 | Radio East: include priceInfo in output (already computed, just not returned) | scraper-ops | 5min | Free data we're throwing away |
| 1.3 | Mohawk: parse .endtop fully (indoor/outdoor, age) | scraper-ops | 30min | Better event cards |
| 1.4 | Moody Amphitheater: add image extraction | scraper-ops | 30min | Events showing without images |
| 1.5 | Add structured metadata fields to NormalizedEvent + Event schema (doorTime, ageRestriction, priceRange, supportingActs, subVenue) | scraper-ops + data-model | 3-4h | Enables all field coverage to surface in UI |
| 1.6 | Antone's: make pagination dynamic (currently hardcoded to 3 pages) | scraper-ops | 30min | Future-proofing |
| 1.7 | Wire enrichment re-trigger when scraper data changes | scraper-ops | 2-3h | Stale enrichment on updated events |

**Total Layer 1:** ~8h. All independent of UI/UX decisions.

---

### Layer 2: UX Architecture (the big decisions — needs spec writing + founder input)

These are the founder's UX questions turned into spec projects. Each needs a spec written, reviewed, and approved before implementation.

| # | Spec Project | Core Question | Dependencies |
|---|-------------|---------------|-------------|
| 2.1 | **Social-First Home Page** | Should the default view surface friend activity inline (avatar stacks, "3 friends interested" on every card) instead of behind a tab? Or should the social tab become the default? | None — this is a product decision |
| 2.2 | **Plan-on-Event-Page** | Should creating a plan unlock a panel/mode on the event page itself, instead of navigating to `/squads/[id]`? What's the minimum viable plan UX within the event page? | Depends on 2.1 (where does the event page live in the flow?) |
| 2.3 | **Groups as Activity Drivers** | Should groups have a feed? Should group activity surface on the home page? ("Your Concert Crew: 4 members interested in Khruangbin") | Depends on 2.1 (where does group info surface?) |
| 2.4 | **Event Detail Page Conversion** | Does the event page do enough to convert browsing → going? What social proof is needed? (friend avatars, friend-of-friend signals, community interest) | Depends on 2.1 + 2.2 |

**Process for each:** Write spec (using `/feature-spec`) → Founder review → Iterate → Approve → Implement.

These are sequential decisions — 2.1 unlocks 2.2-2.4. But implementation can overlap once specs are approved.

---

### Layer 3: Engagement Polish (follows Layer 2 UX decisions)

Once we know what the flows look like, polish the messaging throughout.

| # | Task | Agent | Effort | Impact |
|---|------|-------|--------|--------|
| 3.1 | Wire PLAN_MEETUP_CREATED notification in meetup endpoint | engagement | 1h | #1 missing notification trigger |
| 3.2 | Add missing toast touchpoints (friend accept/decline, meetup saved, error paths) | engagement | 2-3h | ~30% of actions lack feedback |
| 3.3 | Standardize clipboard copy feedback (use shareWithFeedback everywhere) | engagement | 1h | Inconsistent share UX |
| 3.4 | Replace window.confirm() with branded confirmation dialog | engagement + ui-polish | 2h | Native dialogs break the experience |
| 3.5 | Add "Add Friends" CTA to OnboardingModal | engagement | 1h | First impression should push toward social |
| 3.6 | Add activation milestone tracking (firstPlanCreated, firstFriendAdded, firstShare) | engagement | 2h | Understand drop-off in activation funnel |
| 3.7 | Add notification for organizer-removed member | engagement | 1h | Silent removal is rude |
| 3.8 | Fix CTA/header casing violations (5 files) | engagement | 30min | Brand consistency |

**Total Layer 3:** ~12h. Can start on 3.1-3.3 immediately (independent of Layer 2), save 3.4-3.7 for after UX decisions.

---

### Layer 4: Visual Polish (follows Layer 0 constants + Layer 2 UX decisions)

Design system enforcement across the full component tree.

| # | Task | Agent | Effort | Impact |
|---|------|-------|--------|--------|
| 4.1 | Replace decorative emojis with SVG icons (~60 instances, 16 components) | ui-polish | 4h | Most visible violation |
| 4.2 | Deduplicate status config maps (6+ files → single import) | ui-polish | 2h | Eliminates drift |
| 4.3 | Introduce `--brand-primary-border` token + migrate border-green-* (35+ instances) | ui-polish | 3h | Consistent green borders |
| 4.4 | Migrate border-gray-* to --brand-border convention | ui-polish | 3h | 100+ instances, do opportunistically |
| 4.5 | Build shared Input primitive | ui-polish | 2h | Needed for any form-heavy feature |
| 4.6 | Accessibility pass (aria-labels, focus trapping, skip-nav, heading hierarchy) | ui-polish + qa-reviewer | 4h | Only 13 aria-labels across 90 files |
| 4.7 | Build shared IconButton primitive | ui-polish | 1h | Close buttons, action icons |

**Total Layer 4:** ~19h. 4.1-4.3 can start after Layer 0 constants. 4.5-4.7 feed into Layer 5.

---

### Layer 5: New Capabilities (follows Layers 1-4)

The strategic investments. Each blocked by foundation work above.

| # | Capability | Blocked By | Spec Needed? |
|---|-----------|------------|-------------|
| 5.1 | **Transactional Emails** (welcome, plan invite, reminder) | Layer 4 (brand templates, Input primitive) + Layer 3 (engagement patterns) | Yes — roadmap has it next |
| 5.2 | **Spotify OAuth + Taste Graph** | Layer 1 (clean enrichment pipeline) + Layer 2 (where does "For You" surface?) | Yes — Phase 3 spec exists |
| 5.3 | **YouTube/ESPN/TheSportsDB integrations** | Layer 1 (structured metadata fields, enrichment pipeline health) | Yes — enrichment-apis.md idea exists |
| 5.4 | **Create-Your-Own Events** | Layer 2 (Plan-on-Event-Page resolves the "event page IS the plan" question) | Yes — vision calls it "the big bet" |
| 5.5 | **Communities Reveal** | Layer 2 (Groups spec) + Layer 3 (community engagement) + user density | Yes — backend exists, UI hidden |
| 5.6 | **Plan Link Onboarding** (preview → signup → auto-join for non-users) | Layer 2 (what does the plan experience look like?) | Yes — growth bottleneck for user testing |

---

## Recommended Execution Order

```
WEEK 1-2: Layer 0 (foundation fixes) + Layer 1 (data quality)
           All parallelizable, no product decisions needed.
           Ship timezone fixes, constants extraction, alert→toast, field coverage.

WEEK 2-3: Layer 2 specs (UX architecture)
           Write specs for social-first home page, plan-on-event-page, groups.
           Founder reviews and decides direction.
           Meanwhile: Layer 3.1-3.3 (engagement polish that's independent of UX)

WEEK 3-5: Layer 2 implementation + Layer 3 remainder + Layer 4
           Build the new UX architecture.
           Polish engagement and visual system in parallel.

WEEK 5-6: Layer 5 specs + user testing prep
           Now the experience is right. Write specs for new capabilities.
           Invite 20-30 users to test.

WEEK 6+:  Layer 5 implementation based on user feedback
           Transactional emails, Spotify, YouTube/ESPN, create-your-own.
```

---

## What Changed from the Original Roadmap

| Original | Revised | Why |
|----------|---------|-----|
| Transactional emails next | Foundation fixes + UX architecture next | Emails link TO the experience — fix the experience first |
| User testing after bug fixes | User testing after UX revamp | Test the right experience, not the current one |
| Enrichment gated on user testing | Data quality fixes now, enrichment integrations after | Timezone bugs and field gaps are independent of UX |
| Create-your-own events deferred | Spec it during Layer 2 (plan-on-event-page) | The "event page IS the plan" question is the same question |

---

## Cross-Reference: Audit Findings → Layers

| Audit Finding | Layer |
|--------------|-------|
| 6 scrapers with timezone bugs | 0.1 |
| No constants directory | 0.2 |
| 8 alert() calls | 0.3 |
| "check the squad!" leak | 0.4 |
| CommunitySoonStub stale | 0.5 |
| bg-emerald-500 wrong green | 0.6 |
| text-blue-600 mismatch | 0.7 |
| Dead scraper code | 0.8 |
| Antone's missing fields | 1.1 |
| Radio East price not returned | 1.2 |
| Mohawk .endtop partial | 1.3 |
| Moody Amp no images | 1.4 |
| NormalizedEvent lacks metadata | 1.5 |
| Home page social signal buried | 2.1 |
| Plan page is a dead-end | 2.2 |
| Groups underutilized | 2.3 |
| PLAN_MEETUP_CREATED unwired | 3.1 |
| 12 missing toast touchpoints | 3.2 |
| Clipboard feedback inconsistent | 3.3 |
| confirm() → branded dialog | 3.4 |
| Onboarding missing Add Friends | 3.5 |
| 60 emoji violations in 16 files | 4.1 |
| Status config maps duplicated | 4.2 |
| 35+ border-green-* instances | 4.3 |
| 100+ border-gray-* instances | 4.4 |
| Missing Input primitive | 4.5 |
| Only 13 aria-labels in 90 files | 4.6 |
| Transactional emails | 5.1 |
| Spotify/YouTube/ESPN | 5.2-5.3 |
| Create-your-own events | 5.4 |
