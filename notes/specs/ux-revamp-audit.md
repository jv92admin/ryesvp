# UX Revamp Audit — Post Inc 0-2

> Self-critical design review of the UX revamp phase. Not "what did we build" but "where are we lying to ourselves about our design philosophy."
>
> Date: Feb 19, 2026

---

## The Core Tension We Haven't Resolved

The spec says two things that are in conflict:

1. **"Monochrome-first. Color is signal, not decoration."** Primary CTAs should be dark/black (`--action-primary: #171717`). Green only for state (Going, Confirmed).

2. **In practice, every interactive element the user touches is green.** ToggleChip active state = green. StartPlanButton = green border + green text. SmartSquadButton = green. FAB = green background. FilterDrawer Done button = `--action-primary` (dark), but FilterStrip quick chips = `--brand-primary` (green).

We built the token system (Inc 0) and said "action-primary is dark." Then in Inc 1-2, we built new components that still reach for green. The FilterDrawer correctly uses `--action-primary` for its "Done" button, but the ToggleChips sitting right next to it use `--brand-primary-light` + `border-green-300`.

**The question we're avoiding:** Should "active filter chip" be green or dark? If it's state ("this is applied"), green makes sense per the signal palette. If it's an interactive toggle ("click me to change"), dark makes sense per the action palette. We've been treating it as state, but the user experiences it as interaction.

---

## CTA Hierarchy: We Don't Have One

The spec defines `--action-primary` (dark) for primary CTAs and `--signal-going` (green) for state. But we never defined the hierarchy:

| Surface | CTA | Current Color | Should Be? |
|---------|-----|---------------|------------|
| Header | "Start a Plan" | Green border + green text (`--brand-primary`) | ? |
| Header | "Get Started" (logged out) | Dark (`btn-primary`) | Correct |
| Event detail | "Buy on Ticketmaster" | Dark (`--action-primary`) | Correct |
| Event detail | "Interested" / "Going" | Amber / Green | Correct (state) |
| Event card | "Start Plan" | Green border + green text | ? |
| Event card | Going checkmark | Green when active | Correct (state) |
| FilterStrip | Quick chips (This Week, etc.) | Green when active | ? |
| FilterDrawer | "Done" button | Dark (`--action-primary`) | Correct |
| Squad page | "Invite Friends" | Green background | ? |
| FAB | "Start a Plan" | Green background (`--brand-primary`) | ? |

**The problem:** "Start a Plan" is the single most important CTA in the product. It's the conversion action. But it's styled as a green outline button that looks *less* important than the dark "Get Started" or "Buy Tickets" buttons. We're treating our highest-value action like a secondary control.

**Options:**
- A: Make "Start a Plan" dark (monochrome CTA). Green only for state indicators. This is what the spec says we should do.
- B: Accept that green = "social action" and dark = "commercial/navigation action." Two CTA tiers. But then we need to articulate this explicitly.
- C: Keep green for Plan because it's a *signal* — "this is a social thing you do with friends" — and the brand voice is social. But this contradicts the monochrome-first principle.

**We should pick one and commit.** Right now we have A in the spec and C in the code.

---

## The ToggleChip Token Problem

`src/components/ui/Chip.tsx` is the most visible component in the product — it renders the quick filter chips on every page load. Its `primary` color still uses:

```tsx
primary: {
  active: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] border border-green-300',
  inactive: '... hover:border-green-300 hover:bg-green-50',
}
```

This is triple-dipping on legacy tokens:
- `--brand-primary-light` (alias for `--signal-going-light`)
- `--brand-primary` (alias for `--signal-going`)
- Hardcoded `border-green-300` and `hover:bg-green-50`

If we believe our own spec, the active state of a toggle chip should probably look different from "this person is Going to this event." A green ToggleChip and a green Going badge should not be the same visual signal — one means "filter applied" and the other means "friend confirmed attendance."

**What monochrome chips might look like:**
- Active: `bg-[var(--action-primary)] text-[var(--action-primary-text)]` (dark chip, white text)
- Inactive: `bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)]`
- Hover: `border-[var(--border-strong)] bg-[var(--surface-inset)]`

This would make filter chips monochrome (interaction) and leave green exclusively for social state (Going, Confirmed). Strong visual separation.

---

## Page Section Ordering: Too Much Before the Content

Home page section order (logged-in, first visit):

```
1. Header (sticky)
2. InviteBanner (conditional)
3. InviteRedemptionHandler (conditional)
4. FilterStrip (always)
5. OnboardingModal (conditional)
6. SetNameBanner (conditional)
7. OnboardingTips (conditional)
8. HomePageContent (the actual events)
```

On a 375px screen, items 1-7 can push the first EventCard below the fold. The user sees: logo, search bar, 4 chips, a "set your name" banner, and three onboarding tips — before a single event.

**Principle violation:** "One screen, one job." The home page is doing 6 jobs: branding, search, filtering, onboarding, name collection, and event discovery. The spec says events should be front and center.

**What we should consider:**
- Onboarding tips should be *inline with content*, not above it. Show a tip card between the 3rd and 4th event, not before the 1st.
- SetNameBanner could be a toast or a banner pinned to the bottom, not a full-width card at the top.
- Or: accept that first-visit is a special case and optimize for return visits (where banners are gone and FilterStrip → events is tight).

---

## CalendarSidebar: Desktop-Only Data Island

The CalendarSidebar shows New Listings and Presales — but only on desktop (`hidden lg:block`). Mobile users never see this data unless they use the FilterDrawer's Discovery section.

**Problems:**
1. Decorative emojis (✨ New Listings, ⚡ Presales, 🎯 Recommendations) violate the brand guidelines. These are the most visible remaining emoji violations.
2. "Recommendations — Coming Soon" is visible placeholder content. Users see a dashed-border box with greyed-out features. This signals "unfinished product."
3. The sidebar duplicates data that's already in FilterDrawer. If you toggle "New" in FilterDrawer, you get the same events shown in the sidebar. Two surfaces, one dataset.

**When Inc 3 ships:** The PlansStrip replaces the social tab, but CalendarSidebar persists. We should decide: does the sidebar become the PlansStrip on desktop? Or does it stay as a discovery panel? The spec doesn't address this.

---

## Logo & Brand Placement

**Current state:**
- Logo: `RyesVPLogo` (36px SVG) + `RyesVPWordmark` — top-left of header, always visible
- Tagline: "See what's happening. Go with friends." — hidden on mobile, visible at md+
- Header is sticky (`sticky top-0 z-50`), white background, bottom border

**What's working:** Clean, minimal header. Logo doesn't compete with content.

**What's not working:**
- The tagline uses hardcoded `text-gray-500` instead of `text-[var(--text-secondary)]`
- The italic `<em>` on "See" and "Go" feels like the old brand voice, not Lark's. Lark would say: "Find something, bring your people." — warmer, more social.
- The header border uses `var(--brand-border)` (legacy alias) instead of `var(--border-default)` directly.
- When the rename happens (RyesVP → Lark), the wordmark component name changes but the visual treatment is already close to correct. The bigger question: does the Lark logo follow the same "monochrome on white header" pattern, or does it want more contrast (dark header)?

---

## What's Actually Missing from the Design Philosophy

### 1. No Documented Breakpoint Strategy
The spec says "mobile-first, desktop-enhanced" but doesn't define *what enhances at each breakpoint*:
- `sm` (640px): padding increases, text scales up — but what layout changes?
- `md` (768px): tagline appears, some modals switch behavior — but inconsistently
- `lg` (1024px): sidebar appears, cards go 2-col — but `max-w-5xl` vs `max-w-6xl` varies by page

The home page uses `max-w-6xl`. The event detail page uses `max-w-5xl`. Why? Is there a principle? Or was it ad-hoc?

### 2. No Empty State Philosophy
The spec mentions Lark voice for empty states ("Nights start here...") but we don't have a documented pattern for:
- Empty event list (no results for filter)
- Empty friends list (new user)
- Empty plan (solo plan)
- Empty sidebar (no new listings)

Each component handles its own empty state with ad-hoc copy. Some use emojis. Some use illustrations. Some just say "No results." There's no consistent personality.

### 3. No Animation/Transition Guidelines
Inc 0 defined animation tokens (`--ease-out-expo`, `--duration-normal`) but we haven't used them consistently. Some components use Tailwind's `transition-colors`, some use custom CSS. The Dialog has a fade+scale transition, but other components just appear/disappear.

### 4. Card vs Section Ambiguity
Some content groups are cards (white bg, border, shadow, padding). Others are inline sections (no border, no elevation). The FriendsAndStatusCard is a card. The FilterStrip is inline. The PlansStrip (Inc 3) — will it be a card or inline? We haven't decided, and the decision affects visual weight.

---

## Migration Debt Scorecard

| Area | Token Status | Hardcoded Violations |
|------|-------------|---------------------|
| FilterStrip | Mostly migrated (Filters button uses `--action-primary`) | None |
| FilterDrawer | Fully migrated | None |
| SearchInput | Fully migrated | None |
| ToggleChip | Legacy tokens (`--brand-primary`, `border-green-300`, `hover:bg-green-50`) | 3 hardcoded colors |
| TagChip | Uses `category` color (hardcoded `bg-blue-100`) | 2 hardcoded colors |
| Header | Uses `--brand-border` (legacy alias) | `text-gray-500` in tagline |
| StartPlanButton | All 3 variants use `--brand-primary` | `border-green-300`, `hover:border-green-400`, `hover:bg-green-50` (via legacy) |
| CalendarSidebar | Zero token migration | Many: `bg-white`, `border-gray-200`, `text-gray-500`, emojis |
| EventCard | Partially migrated | Several `gray-*` and `green-*` remain |
| FriendsAndStatusCard | Partially migrated | `border-gray-300`, `bg-amber-500`, etc. |
| page.tsx (home) | Not migrated | `bg-gray-50` should be `bg-[var(--surface-bg)]` |

**Honest assessment:** Inc 0 built the token system. Inc 1-2 used tokens in *new* components but didn't migrate *existing* ones. The legacy aliases are doing their job (nothing is broken), but we're not actually converging toward the monochrome palette. At this rate, we'll finish Inc 6 with half the UI on new tokens and half on legacy.

---

## Recommendations for Inc 3+

### Before Inc 3 (quick wins):
1. **Decide the CTA hierarchy.** One answer: green = social action (Plan), dark = commercial/navigation (Buy, Get Started, Done). Document it.
2. **Migrate ToggleChip to new tokens.** This is 15 lines in one file but affects every page. Either go monochrome (dark active state) or explicitly define "filter applied = different shade of green" as distinct from "Going = green."
3. **Kill CalendarSidebar emojis.** Swap ✨→ SVG spark icon, ⚡→ SVG lightning, 🎯→ remove entire Recommendations stub.
4. **Fix home page `bg-gray-50`** → `bg-[var(--surface-bg)]`. One line, big signal of consistency.

### During Inc 3:
5. **Define PlansStrip vs CalendarSidebar relationship.** Does the sidebar absorb PlansStrip on desktop? Or do they coexist?
6. **Document the empty state voice.** Every empty state should feel like the plugged-in friend: "Your friends haven't RSVPed yet — send them the link?" not "No friends found."
7. **Move onboarding below first 3 events.** Let the product sell itself before interrupting with tips.

### Ongoing:
8. **File-by-file token migration.** Every component touched for Inc 3-6 should exit with zero legacy tokens. Don't treat it as a separate task — treat it as part of the Definition of Done.

---

## The Big Question

The monochrome-first direction is aesthetically ambitious and brand-aligned. But we haven't committed to it at the interaction layer. The tokens exist. The spec describes the philosophy. But every button the user taps is still green.

Are we building toward a monochrome product where green is exclusively a social signal? Or are we building a green-primary product with monochrome accents? We need to answer this before Inc 3 adds more green-primary surfaces (Friends Going chip, PlansStrip cards).

**The answer shapes everything downstream:**
- If monochrome: ToggleChips go dark, StartPlanButton goes dark, green only for Going/Confirmed badges.
- If green-primary: Update the spec to say so. Remove the "monochrome-first" language. Own the green brand.
- If hybrid (green = social, dark = commercial): Document the two-tier system explicitly. Make it a design decision, not an accident.

---

*This audit is intentionally harsh. The work is solid — Inc 0-2 shipped clean, passes type checks, and the UI is measurably less cluttered. But the design philosophy needs to be sharpened before we build 4 more increments on top of it.*

---

## Resolution: The Lark Visual Identity

> Added Feb 20, 2026, after external design review (Gemini) and founder alignment.

### Answering "The Big Question"

**Hybrid — but with a clear hierarchy, not an accident.**

The answer is neither "monochrome everything" nor "green everything." It's a three-tier CTA hierarchy where each color has exactly one job:

| Tier | Color | Token | When |
|------|-------|-------|------|
| **Structural** | Dark `#171717` | `--action-primary` | Buy Tickets, Done, Close, Get Started — commercial/navigation actions |
| **Engagement** | Warm gold `#B45309` | `--action-engage` | Start Plan, Invite, active filter chips, Friends filter — social/friend actions |
| **Signal: Going** | Green `#16A34A` | `--signal-going` | Going badge only — **never** a CTA button |
| **Signal: Interested** | Amber `#F59E0B` | `--signal-interested` | Interested badge only |
| **Signal: Danger** | Red `#DC2626` | `--signal-danger` | Leave Plan, errors |
| **Informational** | Category tints | per-category | Concert purple, Comedy yellow — subtle, not interactive |

### Why Warm Gold (`#B45309`)

Green was doing double duty: "you're confirmed for this event" AND "tap this to do something social." Those are fundamentally different signals. A friend's Going badge and a Start Plan button should not look the same.

Warm gold solves this:
- **Distinct from Going** (green) — no visual confusion between state and action
- **Distinct from Interested** (bright amber `#F59E0B`) — deeper, richer, clearly a CTA not a state
- **5.2:1 contrast ratio** against white — WCAG AA compliant
- **Nightlife-appropriate** — warm, inviting, "golden hour before the show." Aligns with Lark's brand voice

### Warm Engagement Palette

```css
--action-engage: #B45309;         /* deep warm gold */
--action-engage-hover: #92400E;   /* darker on press */
--action-engage-text: #FFFFFF;    /* white text on gold */
--action-engage-light: #FFFBEB;   /* warm glow for active chip backgrounds */
```

### De-SaaS Card Treatment

The external review called out our cards as "SaaS dashboard" — soft shadows, rounded corners, pastel pills. The fix:

- **Mobile:** No `shadow-sm`. No rounded borders. Whitespace + `border-b` separator between cards. Content breathes.
- **Desktop:** `border-transparent hover:border-[var(--border-default)]` — borders appear on interaction, not at rest.
- **Principle:** Shadows are SaaS. Whitespace and borders are editorial.

### Unified Badge System

Currently fragmented: NEW = green pill, PRESALE = blue pill, SOLD OUT = red pill, category = colored backgrounds. Five different treatments for markers.

**One treatment for all markers:**
- `font-semibold uppercase tracking-wide text-[10px]`
- Monochrome (neutral text color)
- Category badges keep subtle color tint (informational, not interactive)
- Everything else — NEW, PRESALE, SOLD OUT — gets the same neutral typographic treatment
- No blue presale pills. No green "new" pills. One visual language.

### Component Migration Map

| Component | Current | Target |
|-----------|---------|--------|
| `ToggleChip` (active) | `--brand-primary-light` + green borders | `--action-engage-light` + warm borders |
| `StartPlanButton` (all variants) | `--brand-primary` green | `--action-engage` warm gold |
| `SmartSquadButton` | Green variants | `.btn-engage` warm gold |
| `EventCard` | `shadow-sm rounded-lg` | No shadow, `border-b` mobile, hover border desktop |
| `StatusBadge` (NEW) | Green primary pill | Monochrome typographic |
| `StatusBadge` (PRESALE) | Blue info pill | Monochrome typographic |
| `Badge` (category) | Colored backgrounds | Subtle tint (kept, but harmonized) |
| `FriendsAndStatusCard` Going | Green button | Green **badge** (state, not CTA) |
| `FilterStrip` Filters button | Action primary border when active | Warm engage border when active |

### Increment Restructuring

This resolution introduces a new **Inc 3: Lark Visual Identity** — a cosmetic skin change that applies the warm palette, de-SaaS cards, and unified badges before the structural changes in Inc 4+. The old Inc 3-6 become Inc 4-7:

```
INC 0  Design Foundation          ✅
INC 1  Modal & People System      ✅
INC 2  Filter Cleanup             ✅
INC 3  Lark Visual Identity       ← NEW: warm tokens, de-SaaS cards, unified badges, chip migration
INC 4  Social-First Home          ← was Inc 3
INC 5  Event Page Zones           ← was Inc 4
INC 6  Plan-on-Event-Page         ← was Inc 5
INC 7  Groups Surfacing           ← was Inc 6
```

### What This Changes for All Agents

- **`/ui-system` skill**: Full palette rewrite — warm engagement tokens, CTA hierarchy, de-SaaS card rules, unified badge spec
- **`/ux-comms` skill**: Expanded with Lark voice, copy patterns, warm gold for engagement surfaces
- **`ui-polish` agent**: Brand Direction updated with warm palette, de-SaaS criteria, known debt queue
- **`qa-reviewer` agent**: New BLOCKER items — green used as CTA, shadows on cards, inconsistent badges
- **`engagement` agent**: Visual Tone section — warm gold = social action, dark = commercial

Every skill, agent, and spec now describes the same target. When Inc 3 begins, the agent reads `/ui-system`, sees warm gold, and builds accordingly.
