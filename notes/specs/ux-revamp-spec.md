# UX Revamp Spec

> The complete UX architecture redesign.
> Structured as 9 mutable increments (0-7 + 3.5), each shippable independently.
> Brand direction informed by `references/lark-proposal-final.pdf`.
> Date: 2026-02-19 · Updated: 2026-02-22
>
> **Status:** Inc 0–6 shipped. Full Lark dark-mode visual redesign layered on top (Feb 22, 2026).
> The visual system described in this spec (warm gold `#B45309`, white canvas, colored badges) was superseded by the Lark dark monochrome system (`#0A0A0A` canvas, `#E8E8E8` accent, Space Grotesk, zero shadows, monochrome badges). See `notes/design/ui-reference.md` for the **current** design system reference.
> This spec is preserved as historical context for the UX architecture decisions (zone layout, component structure, incremental strategy). The token values and color references in Inc 0–3 are outdated.

---

## Brand Context: Lark

> **Note:** The rename from RyesVP → Lark is NOT part of this spec. But the Lark brand proposal defines the visual and tonal direction for everything we build. Code stays "RyesVP" / "Squad" internally. UI design aligns with Lark's world.

**Visual direction (from brand doc):**
- **High-contrast monochrome.** Dark canvas, clean white UI. Not neon gradients, not warm-tone lifestyle, not geometric tech minimalism.
- **Texture of live events.** Sharpie strokes, printed setlist grain, folded flyer crease. Raw, authentic, understated.
- **"The house lights go down."** The brand starts where a night out starts. Edge, intention, nightlife.

**Voice (from brand doc):**
- Personality: "The plugged-in friend who always knows about the show before you do. Not loud, not tryhard — just naturally plugged in and always down to go."
- Product language: **Lark** (platform), **Plan** (the thing you create), **"on Lark"** (how you reference it)
- Search bar prompt: `"What kind of night are we having?"` — exploration, not commands
- Tone samples: "Find something, bring your people." / "Plans with your people, not your inbox." / "See you out there."

**What this means for our code (now):**
- Palette tokens shift toward monochrome-primary, green becomes accent (not primary action color)
- **Warm gold (`#B45309`) for engagement CTAs** — Start Plan, Invite, active filter chips, Friends filter. Distinct from structural dark and signal green.
- Three-tier CTA hierarchy: dark (structural) → warm gold (engagement/social) → green (state only)
- New copy we write follows Lark's voice (warm, social, natural)
- Components designed with the Lark aesthetic even while still called RyesVP in code
- When the rename happens, the UI is already aligned — it's just string changes

---

## Guiding Principles

1. **Social signal is the product.** Every surface should answer "who do I know that's going?" without requiring a tap.
2. **One screen, one job.** No tabs that hide the value prop. No modals that should be inline. No separate pages that should be panels.
3. **Progressive disclosure.** Show 3 things well, offer 10 more on demand. Filters, buttons, and information all follow this rule.
4. **Consistency compounds.** Same Modal, same PeopleList, same color tokens everywhere. Build it once in Increment 0, use it in every increment after.
5. **Mobile-first, desktop-enhanced.** Design at 375px, then add desktop features (sidebar, wider grid, hover states).
6. **Monochrome-first, color as signal.** Black, white, and gray are the foundation. Color appears only to signal state (going = green, interested = amber, danger = red). This aligns with Lark's "house lights go down" aesthetic and makes the social signals pop.
7. **Warm for engagement, dark for structure.** Social/friend actions (Start Plan, Invite, active chips) use warm gold (`--action-engage`). Commercial/navigation actions (Buy Tickets, Done, Get Started) use dark (`--action-primary`). Green is **never** a CTA — it's a state signal only (Going badge).
8. **The plugged-in friend.** Every piece of copy sounds like a friend who knows what's happening — not a robot, not a marketer, not a concierge. Warm, brief, social.

---

## Increment Overview

```
INC 0    Design Foundation          ✅ tokens, constants, primitives, monochrome palette
  ↓
INC 1    Modal & People System      ✅ Dialog primitive, PeopleList, 4 modals migrated
  ↓
INC 2    Filter Cleanup             ✅ FilterDrawer, FilterStrip rewrite, old chips deprecated
  ↓
INC 3    Lark Visual Identity       ✅ warm tokens, de-SaaS cards, unified badges, chip migration
  ↓
INC 3.5  Editorial Polish           ✅ text-only badges, editorial headers, breathing room, underline tabs
  ↓
INC 4    Social-First Home          ✅ kill ViewToggle, PlansStrip, Friends chip, 7 components deleted
  ↓
INC 5    Event Page Hierarchy       ✅ integrated hero, 3-state architecture, inline attendance, state-dependent bar
  ↓
INC 6    Plan-on-Event-Page         ✅ interactive panel, /squads/ redirect, legacy deprecated
  ↓
INC 7    Groups Surfacing           ← group labels, group filter, group activity
```

Each increment is independently shippable. Later increments benefit from earlier ones but don't hard-block (except Inc 0, which everything depends on).

### Known Color Debt (post Inc 4) — RESOLVED

> **Resolved Feb 22, 2026** as part of the Lark dark-mode visual redesign.
> User avatars → flat `--bg-surface` + `--lark-text-secondary` initials (no bright colors).
> Category labels → monochrome `--lark-text-secondary` (no colored pills).
> External brand colors (Spotify, YouTube, TM) → kept as documented exceptions in `externalBrands.ts`.
> See `notes/design/ui-reference.md` § Color Philosophy for the full monochrome rules.

---

## Increment 0: Design Foundation ✅ COMPLETE

**Goal:** Establish the constants, tokens, and color discipline that every subsequent increment builds on. No user-visible UX changes — purely infrastructure.

**Agent:** `ui-polish` (primary), `qa-reviewer` (gate)

**Shipped:** Feb 2026 · Branch `revamp/ux-architecture`

**Why first:** We're about to build ~6 new components and restructure ~10 existing ones. If colors and constants aren't clean, we'll build new things with old inconsistencies.

### 0A. Constants Extraction

Create `src/lib/constants/` with centralized maps that are currently duplicated:

**`src/lib/constants/categoryColors.ts`**
```ts
// Duplicated in: EventCard.tsx:~L25, events/[id]/page.tsx:~L69
// Single source of truth for category → color class mapping
export const categoryColors: Record<string, string> = {
  CONCERT: 'bg-purple-100 text-purple-800',
  COMEDY: 'bg-yellow-100 text-yellow-800',
  THEATER: 'bg-pink-100 text-pink-800',
  SPORTS: 'bg-blue-100 text-blue-800',
  FESTIVAL: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800',
};
```

**`src/lib/constants/statusColors.ts`**
```ts
// Duplicated in: StatusBadge.tsx, squad components (6+ files)
// Maps event/attendance status → color class
export const statusColors = { ... };
```

**`src/lib/constants/externalBrands.ts`**
```ts
// Hardcoded in: ExploreCard.tsx, PrimaryCTACard.tsx
// External service brand colors as CSS-safe values
export const externalBrands = {
  spotify: { bg: '#1DB954', hover: '#1ed760', label: 'Spotify' },
  youtube: { bg: '#FF0000', hover: '#cc0000', label: 'YouTube' },
  instagram: { gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]', label: 'Instagram' },
  ticketmaster: { bg: '#01579B', label: 'Ticketmaster' },
};
```

### 0B. Color Palette: Monochrome-First Shift

The Lark brand doc calls for **high-contrast monochrome** — a stark black-and-white palette where color appears only as signal. This is a paradigm shift from the current green-primary design.

**The shift:**
- **Current:** Green (`#16A34A`) is the primary action color. Everything important is green.
- **Lark direction:** Black and white are the foundation. Green becomes a *signal* color — it means "going" / "confirmed" / "active." It's not the brand color anymore; it's a *state* color.

**Palette architecture:**

| Role | Current | Lark Direction | Token |
|------|---------|---------------|-------|
| Canvas / page bg | `gray-50` (#FAFAFA) | Near-white or off-white | `--surface-bg` |
| Card / elevated surface | White (#FFFFFF) | White | `--surface-card` |
| Inset / recessed | `gray-100` (#F5F5F5) | Light gray | `--surface-inset` |
| Primary text | `gray-900` (#171717) | Near-black | `--text-primary` |
| Secondary text | `gray-600` (#4B5563) | Medium gray | `--text-secondary` |
| Muted text | `gray-400` (#9CA3AF) | Light gray | `--text-muted` |
| Borders | `gray-200` (#E5E5E5) | Subtle gray | `--border-default` |
| **Action / CTA** | **Green (#16A34A)** | **Near-black or dark** | `--action-primary` |
| **Engagement / social** | — | **Warm gold (#B45309)** | `--action-engage` |
| Going / confirmed | Green | Green (kept as state) | `--signal-going` |
| Interested / warm | Amber | Amber (kept as state) | `--signal-interested` |
| Danger / error | Red | Red (kept as state) | `--signal-danger` |
| Info / link | Blue | Blue (kept as state) | `--signal-info` |

**Key decision:** The primary CTA button (e.g., "Buy Tickets", "Start Plan") shifts from green to **dark/black** — aligning with the monochrome brand. Green only appears on state indicators (Going badge, active status). This makes social signals *pop* against the monochrome UI.

**Hardcoded color fixes (same as before, plus palette shift):**

| Violation | Count | Fix |
|-----------|-------|-----|
| `bg-emerald-500` | 2 files | → `bg-[var(--signal-going)]` (state, not action) |
| `text-blue-600` | 5 files | → `text-[var(--signal-info)]` |
| `border-green-*` | 35+ instances | → `border-[var(--signal-going)]` for state, `--border-default` for decoration |
| `border-gray-200` vs tokens | 100+ instances | Opportunistic migration to `--border-default` |
| Green primary buttons | everywhere | → `--action-primary` (dark/black) |
| Decorative emojis | ~60 instances, 16 components | → SVG icons |

**New tokens for `globals.css`:**
```css
:root {
  /* ==========================================
     LARK DESIGN TOKENS
     Monochrome-first. Color is signal, not decoration.
     ========================================== */

  /* SURFACES — the canvas */
  --surface-bg: #FAFAFA;              /* page background */
  --surface-card: #FFFFFF;            /* card / elevated */
  --surface-inset: #F5F5F5;           /* recessed areas */

  /* TEXT — high contrast */
  --text-primary: #171717;            /* headlines, body */
  --text-secondary: #525252;          /* supporting text */
  --text-muted: #A3A3A3;             /* hints, placeholders */

  /* BORDERS */
  --border-default: #E5E5E5;          /* card borders, dividers */
  --border-strong: #D4D4D4;           /* hover borders, emphasis */

  /* ACTION — monochrome primary */
  --action-primary: #171717;          /* primary buttons (dark) */
  --action-primary-hover: #404040;    /* hover state */
  --action-primary-text: #FFFFFF;     /* text on primary buttons */
  --action-secondary: #FFFFFF;        /* secondary buttons (white) */
  --action-secondary-border: #D4D4D4; /* secondary button border */

  /* SIGNAL COLORS — color only as state indicator */
  --signal-going: #16A34A;            /* going, confirmed, active */
  --signal-going-light: #DCFCE7;      /* going background tint */
  --signal-interested: #F59E0B;       /* interested, warm intent */
  --signal-interested-light: #FEF3C7; /* interested background tint */
  --signal-danger: #DC2626;           /* error, destructive */
  --signal-info: #3B82F6;             /* links, informational */

  /* ANIMATION */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* LEGACY ALIASES (keep during migration, remove when done) */
  --brand-primary: var(--signal-going);
  --brand-primary-hover: #15803D;
  --brand-primary-light: var(--signal-going-light);
  --brand-black: var(--text-primary);
  --brand-gray: var(--surface-bg);
  --brand-border: var(--border-default);
  --brand-danger: var(--signal-danger);
  --brand-info: var(--signal-info);
}
```

**Migration strategy:** Legacy aliases (e.g., `--brand-primary` → `--signal-going`) let us migrate incrementally. Old components keep working while we update them file by file. Once all references are migrated, remove the aliases.

### 0C. New Primitives

**`IconButton`** — icon-only action button with aria-label (needed for Share, Close, Filter, etc.)
```tsx
// src/components/ui/IconButton.tsx
interface IconButtonProps {
  icon: ReactNode;
  label: string;        // required aria-label
  onClick: () => void;
  variant?: 'ghost' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
}
```

**`Input`** — styled form input (needed for FilterDrawer, search, date pickers)
```tsx
// src/components/ui/Input.tsx
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

### 0D. Emoji → SVG Migration (Phase 1)

Replace the highest-visibility emoji violations first. Full migration across 16 components is large — do the event detail page and home page cards in this increment, remainder opportunistically.

Priority files:
- `events/[id]/page.tsx` — `📍` location pin, `categoryEmojis` map in placeholder
- `FriendsAndStatusCard.tsx` — `★` and `✓` in buttons
- `EventCard.tsx` — any inline emoji

### 0E. Definition of Done

- [ ] `src/lib/constants/` exists with categoryColors, statusColors, externalBrands
- [ ] All components import from constants (no inline color maps)
- [ ] Zero `bg-emerald-500` or `text-blue-600` in components
- [ ] New tokens in globals.css (surface levels, animation, primary-border)
- [ ] IconButton and Input primitives in `src/components/ui/`
- [ ] Event page and home page card emojis replaced with SVG
- [ ] `qa-reviewer` audit passes with zero BLOCKERs on touched files

---

## Increment 1: Modal & People System ✅ COMPLETE

**Goal:** Unified modal behavior and a shared people display component. Currently 12 modal components, each hand-rolling backdrop/card/close/scroll. One shared system, used everywhere.

**Agent:** `ui-polish` (primary), `qa-reviewer` (gate)

**Depends on:** Inc 0 (tokens, IconButton for close button)

**Shipped:** Feb 2026 · 4 of 12 modals migrated (SquadCreation, SquadInvite, SquadPage, StartPlan). Remaining 8 modals deferred — lower-traffic surfaces, will migrate opportunistically.

### 1A. Upgrade Dialog Primitive

The existing `Dialog` in `src/components/ui/dialog.tsx` is a good start but needs:
- **Focus trapping** — tab should cycle within the modal
- **Escape to close** — keyboard dismissal
- **Body scroll lock** — prevent background scrolling
- **Transition** — fade+scale entry using `--ease-out-expo` and `--duration-normal`
- **Size variants** — `sm` (max-w-sm), `md` (max-w-md), `lg` (max-w-lg), `sheet` (mobile bottom sheet)
- **Close button** — use IconButton from Inc 0, consistent position

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen} size="md">
  <DialogHeader>
    <DialogTitle>3 friends going</DialogTitle>
  </DialogHeader>
  <DialogBody>
    {/* scrollable content area */}
  </DialogBody>
  <DialogFooter>
    {/* optional action buttons */}
  </DialogFooter>
</Dialog>
```

### 1B. PeopleList Component

Shared component for displaying grouped lists of people. Used in 4+ surfaces.

```tsx
// src/components/ui/PeopleList.tsx
interface PeopleGroup {
  label: string;                    // "Going", "Interested", "Members"
  color: 'green' | 'amber' | 'blue' | 'gray';
  people: Array<{
    id: string;
    displayName: string | null;
    email: string;
  }>;
}

interface PeopleListProps {
  groups: PeopleGroup[];
  showGroupHeaders?: boolean;       // true = grouped display, false = flat list
  onPersonClick?: (id: string) => void;  // default: navigate to profile
  emptyMessage?: string;
}
```

**Rendering:** Avatar (using existing `getAvatarStyle`/`getInitials`) + display name + optional status dot. Same everywhere.

### 1C. Modal Migration

Migrate all 12 existing modals to use upgraded Dialog + PeopleList:

| Modal | Current Pattern | Migration |
|-------|----------------|-----------|
| CombinedAttendanceModal | Custom backdrop + card | Dialog size="sm" + PeopleList |
| SquadPageModal | Custom backdrop | Dialog size="lg" |
| SquadCreationModal | Custom backdrop | Dialog size="md" |
| SquadInviteModal | Custom backdrop | Dialog size="md" + PeopleList |
| InviteFriendsModal | Custom backdrop | Dialog size="md" + PeopleList |
| CreateGroupModal | Custom backdrop | Dialog size="sm" |
| CreateListModal | Custom backdrop | Dialog size="sm" |
| CreateCommunityModal | Custom backdrop | Dialog size="sm" |
| ListDetailModal | Custom backdrop | Dialog size="md" |
| PerformerModal | Custom backdrop | Dialog size="md" |
| StartPlanModal | Custom backdrop | Dialog size="sm" |
| OnboardingModal | Custom backdrop | Dialog size="md" |

This is mechanical but high-impact. Every modal gets: consistent border radius, padding, close button, scroll handling, focus trap, escape-to-close, and transition animation.

### 1D. Definition of Done

- [ ] Dialog primitive upgraded with focus trap, scroll lock, transitions, size variants
- [ ] PeopleList component built with grouped/flat modes
- [ ] All 12 modals migrated to Dialog primitive
- [ ] Visual consistency verified: same border-radius, padding, close style everywhere
- [ ] Keyboard navigation works (Tab cycles, Escape closes)
- [ ] `qa-reviewer` audit: zero BLOCKERs, consistent modal patterns

---

## Increment 2: Filter Cleanup ✅ COMPLETE

**Goal:** Tame the 12-element FilterStrip into search + 3-4 quick chips + overflow drawer. Home page should show events, not a wall of filter buttons.

**Agent:** `ui-polish` (primary), `engagement` (copy/empty states), `qa-reviewer` (gate)

**Depends on:** Inc 0 (tokens, Input primitive), Inc 1 (Dialog for FilterDrawer on mobile)

**Shipped:** Feb 2026 · FilterDrawer (sheet), FilterStrip rewrite, SearchInput token updates, 4 old chip components deprecated. Validated at 375px and 1280px via DevTools MCP.

### 2A. FilterStrip Redesign

**Current:** Search (full row) → 12 chips in a wrapping row.

**New:** Search (full row) → 3-4 most-used chips + "Filters" overflow button.

```
┌─────────────────────────────────────────────┐
│ 🔍 What kind of night are we having?        │  ← Lark brand voice
└─────────────────────────────────────────────┘
[This Week] [Weekend] [Concerts] [⚙ Filters]
```

**Quick chips (always visible):** This Week, Weekend, Concerts. These are the 3 most common filters.

**"Filters" button:** Shows active filter count badge when filters are applied: `[⚙ Filters (3)]`.

**Active filter display:** When non-quick filters are active, show them as dismissible TagChip below:
```
[This Week] [Weekend] [Concerts] [⚙ Filters (2)]
[Comedy ×] [Stubb's ×]          ← only shown when active
```

### 2B. FilterDrawer Component

On mobile: bottom sheet (Dialog size="sheet"). On desktop: dropdown panel anchored to the Filters button.

```
┌─────────────────────────────────────────┐
│ Filters                           [×]   │
│                                         │
│ When                                    │
│ ○ This Week  ○ This Weekend             │
│ [From: ___________] → [To: __________]  │
│                                         │
│ Category                                │
│ ○ Concerts  ○ Comedy  ○ Theater         │
│ ○ Sports    ○ Other                     │
│                                         │
│ Discovery                               │
│ ○ New (12)  ○ Presales (3)              │
│                                         │
│ Venues                                  │
│ [Search venues...                     ] │
│ ☑ Stubb's   ☑ Mohawk   ☐ Emo's        │
│ ☐ Moody Center  ☐ Scoot Inn  ...       │
│                                         │
│ [Clear All]                      [Done] │
└─────────────────────────────────────────┘
```

All existing filter logic stays — URL params, instant apply. We're just reorganizing the UI.

### 2C. Component Changes

| Component | Change |
|-----------|--------|
| `FilterStrip.tsx` | Rewrite: search + 3 quick chips + Filters button |
| `DateChips.tsx` | Move into FilterDrawer (except This Week/Weekend quick chips) |
| `CategoryChips.tsx` | Move into FilterDrawer (except Concerts quick chip) |
| `DiscoveryChips.tsx` | Move entirely into FilterDrawer |
| `VenueFilter.tsx` | Move entirely into FilterDrawer (reuse dropdown internals) |
| NEW: `FilterDrawer.tsx` | New component: organized filter sections |

### 2D. Definition of Done

- [ ] FilterStrip shows max 4 chips + overflow on mobile
- [ ] FilterDrawer opens as bottom sheet (mobile) or dropdown (desktop)
- [ ] All existing filter params still work (URL-driven, no regressions)
- [ ] Active filters show as dismissible chips
- [ ] Filter count badge on overflow button
- [ ] No horizontal scroll on 375px viewport
- [ ] `qa-reviewer` audit passes

---

## Increment 3: Lark Visual Identity ✅ COMPLETE

**Goal:** Apply the warm engagement palette, de-SaaS card treatment, and unified badge system across the existing UI. This is a cosmetic skin change — no structural layout changes, no new features. Every component exits this increment looking like Lark, not a SaaS dashboard.

**Agent:** `ui-polish` (primary), `qa-reviewer` (gate)

**Depends on:** Inc 0 (tokens), Inc 2 (FilterStrip chips to migrate)

**Shipped:** Feb 2026 · 15 files changed. Button `engage` variant, Chip `primary` → warm gold, de-SaaS cards (shadow removal, mobile border-b, desktop hover border reveal), monochrome event badges, scoped legacy token cleanup.

### 3A. Warm Engagement Token Migration

Migrate all social/friend CTAs from green (`--brand-primary`) to warm gold (`--action-engage`):

| Component | Current | Target |
|-----------|---------|--------|
| `ToggleChip` active | `--brand-primary-light` + `border-green-300` | `--action-engage-light` + `border-amber-700/30` |
| `StartPlanButton` (all 3 variants) | `--brand-primary` green | `.btn-engage` warm gold |
| `SmartSquadButton` | Green variants | `.btn-engage` warm gold |
| `FilterStrip` Filters button (active) | `--action-primary` border | `--action-engage` border |
| `FriendsAndStatusCard` action buttons | Green-tinted | Warm gold for social CTAs, green for Going state only |

**Rule:** After this sub-increment, green (`--signal-going`) appears ONLY on Going/Confirmed badges. Never on a clickable CTA.

### 3B. De-SaaS Card Treatment

Remove shadows and soften card treatment across all card components:

- **Mobile:** Remove `shadow-sm` / `shadow-md`. Use whitespace + `border-b border-[var(--border-default)]` as separators.
- **Desktop:** `border border-transparent hover:border-[var(--border-default)]` — borders appear on hover, not at rest.
- **EventCard:** Drop `shadow-sm rounded-lg` → no shadow, `border-b` on mobile, hover border on desktop.
- **FriendsAndStatusCard, SocialProofCard:** Same treatment.
- **Principle:** Shadows are SaaS. Whitespace and borders are editorial.

### 3C. Unified Badge System

Consolidate all marker badges (NEW, PRESALE, SOLD OUT, category) into one visual language:

**Current fragmentation:**
- NEW → green primary pill (`StatusBadge` variant)
- PRESALE → blue info pill (`StatusBadge` variant)
- SOLD OUT → red danger pill (`StatusBadge` variant)
- Category → colored background pills (purple, yellow, etc.)

**Target:**
- All status markers: `font-semibold uppercase tracking-wide text-[10px]` monochrome treatment
- Category badges: Keep subtle color tint (informational, not interactive) but harmonize sizing
- One `BadgeMarker` component or unified `StatusBadge` variant for all markers

### 3D. Legacy Token Cleanup

With warm tokens in place, remove legacy aliases that are no longer referenced:

1. Grep for `--brand-primary` usage across all components
2. Replace with appropriate new token (`--action-engage` for CTAs, `--signal-going` for state)
3. Remove alias from `globals.css` once zero references remain
4. Repeat for `--brand-primary-hover`, `--brand-primary-light`, `--brand-border`, etc.

**Note:** This is opportunistic — only remove aliases that reach zero references in this increment.

### 3E. Definition of Done

- [ ] Zero green CTAs — `--signal-going` used only for Going/Confirmed badges
- [ ] All social CTAs use `--action-engage` (warm gold)
- [ ] No `shadow-sm` or `shadow-md` on event cards or content cards
- [ ] All status markers (NEW, PRESALE, SOLD OUT) use unified typographic treatment
- [ ] Category badges harmonized in size with status markers
- [ ] Input focus rings use `--action-engage` (not green)
- [ ] Legacy alias usage reduced (track count before/after)
- [ ] Mobile (375px) and desktop (1024px+) verified via DevTools MCP
- [x] `qa-reviewer` audit passes with zero BLOCKERs

---

## Increment 3.5: Editorial Polish

**Goal:** The page should *feel* like a different app — not just have correct tokens. Inc 3 gave us the right colors underneath, but the layout density, typography rhythm, and information design still read as a generic SaaS dashboard. This increment is purely visual: spacing, type hierarchy, badge treatment, and breathing room. No new features, no data changes.

**Agent:** `ui-polish` (primary), `qa-reviewer` (gate)

**Depends on:** Inc 3 (tokens and card treatment in place)

**Self-critique that motivated this:** After Inc 3 shipped, the home page looked ~95% the same. Token migration is invisible to users. The structural problems — identical card density, colored badge pills, tiny action targets, cramped spacing, SaaS-like ViewToggle, cookie-consent sign-in banner — require layout and typography changes, not color swaps.

### 3.5A. Category Badges → Text-Only Micro Labels

**Current:** Colored pill backgrounds (purple CONCERT, yellow COMEDY, blue SPORTS). Screams "dashboard."

**Target:** Text-only micro labels — no background, no pill. Just typographic weight.

```
Current:  [CONCERT]  (purple bg, purple text, rounded pill)
Target:   CONCERT    (text-[var(--text-secondary)], no background)
```

- Remove `bg-*` and `rounded` from category badge in EventCard and event detail page
- Keep `text-[10px] font-semibold uppercase tracking-wide`
- Color comes from text only: `text-[var(--text-secondary)]` default, or subtle category tint via a thin left-border or dot if hierarchy feels flat
- `categoryColors.ts` updated: values become text-only classes

### 3.5B. Date Section Headers → Editorial Weight

**Current:** `text-sm font-semibold text-gray-500 uppercase tracking-wide` — small, gray, gets lost.

**Target:** Section markers with editorial presence.

```
Current:  TODAY                          (small, gray, lost in the feed)
Target:   Today                          (text-base font-semibold, sentence case, with subtle rule)
          ─────────────────────────
```

- Size: `text-sm` → `text-base` (or `text-sm` with more weight)
- Case: `uppercase` → sentence case ("Today", "Tomorrow", "Saturday, Feb 22")
- Color: `text-gray-500` → `text-[var(--text-primary)]`
- Add a subtle horizontal rule or extra bottom margin for section separation
- Sticky behavior stays

### 3.5C. Card Spacing & Breathing Room

**Current:** `space-y-2` (8px) between cards. Dense spreadsheet feel.

**Target:** More generous vertical rhythm.

- Cards: `space-y-2` → `space-y-0` (let padding + border-b handle spacing naturally)
- Card internal padding: evaluate `p-4` — may need `py-5` for more vertical air
- Date section gap: `space-y-4` → `space-y-6` (more separation between day groups)
- Meta row (badges + actions): evaluate if `mt-3 pt-3 border-t` divider is needed — removing it and integrating badges inline with venue/date could flatten the card and feel less chunky

### 3.5D. ViewToggle Softening

**Current:** Segmented control pill (`bg-gray-100 rounded-lg p-1`) with shadow on active tab. Very SaaS.

**Options:**
1. **Restyle as underline tabs** — Text links with active underline, not a segmented control. Less visual weight.
2. **Pull forward the kill** — Remove entirely (Inc 4 deletes it). Accept that logged-in users temporarily lose social tab access until Inc 4 adds inline social signals.
3. **Hide for logged-out users** — Only show when logged in (logged-out users see a unified feed anyway since "Your Events" requires auth).

Recommended: Option 1 (restyle) — keeps functionality, removes the SaaS aesthetic.

### 3.5E. Sign-In Prompt → Warm Invitation

**Current:** Horizontal bar with "Sign in or sign up to track events..." — looks like a cookie consent banner.

**Target:** Something that feels like an invitation, not a legal notice.

Options:
- Inline card with Lark voice: "See what your friends are up to this weekend. → Sign in"
- Contextual prompt that appears near social features (on event cards, friend sections) rather than a persistent top banner
- Subtle, dismissible, warm tone — not full-width alert bar

### 3.5F. Action Buttons → More Inviting

**Current:** 28px gray circles with tiny icons. Invisible, uninviting.

**Target:** Slightly more prominent, with better affordance.

- Size: `w-7 h-7` → `w-8 h-8` (32px) minimum
- Inactive state: lighter background that still reads as "tappable"
- Consider text labels on wider screens: `✓ Going` / `★ Interested` instead of icon-only
- Active states already look good (green Going, amber Interested) — it's the *inactive* state that's invisible

### 3.5G. Definition of Done

- [ ] Category badges are text-only (no colored pill backgrounds) on EventCard and event detail page
- [ ] Date headers feel like editorial section markers (heavier weight, sentence case, rule/divider)
- [ ] Card spacing feels generous, not cramped
- [ ] ViewToggle is either restyled or removed
- [ ] Sign-in prompt feels warm, not GDPR
- [ ] Going/Interested buttons are visible and inviting in inactive state
- [ ] Mobile (375px) and desktop (1024px+) verified via DevTools MCP — should feel like a *different app*
- [ ] `qa-reviewer` audit passes with zero BLOCKERs

---

## Increment 4: Social-First Home

**Goal:** Kill the All Events / Your Events tab split. Surface social signals inline on every event card. Plans strip at top.

**Agent:** `ui-polish` (layout + cards), `engagement` (copy, empty states, social messaging), `qa-reviewer` (gate)

**Depends on:** Inc 0 (tokens), Inc 1 (PeopleList for friend display), Inc 2 (filter cleanup — "Friends Going" becomes a quick filter chip), Inc 3 (visual identity — cards and chips already styled)

### 4A. Kill ViewToggle

Remove the `ViewToggle` component and the two-tab paradigm. One unified feed.

**Current:** Toggle between "All Events" (calendar view) and "Your Events" (social tab with SectionA/SectionB).

**New:** Single feed. Social signals woven into every card. Social-specific views are filters, not separate tabs.

### 4B. Plans Strip

A horizontal scrolling strip at the top of the feed showing the user's active plans. This replaces the "Your Plans" section from SocialTab.

```
YOUR PLANS (2)
┌──────────────┐ ┌──────────────┐
│ Khruangbin   │ │ Comedy Night │
│ Fri, Mar 7   │ │ Sat, Mar 8   │
│ 3 friends    │ │ You + 1      │
│ [View Plan]  │ │ [View Plan]  │
└──────────────┘ └──────────────┘
```

- Only shown when user has plans
- Compact horizontal scroll cards (not full EventCards)
- Tapping opens the plan-on-event-page (Inc 5) or squad page
- Subtle highlight on cards with unread plan notifications

### 4C. Social Signals on EventCard

Every EventCard in the main feed gains inline social signals:

```
┌─ EventCard ─────────────────────────────┐
│ [Hero Image]                            │
│                                         │
│ Artist Name                             │
│ Fri, Mar 7 · Stubb's                   │
│ CONCERT                                 │
│                                         │
│ 👤👤👤 3 friends going                  │  ← NEW: friend avatars + count
│        Sarah, Mike +1 interested        │  ← NEW: friend names
└─────────────────────────────────────────┘
```

Data source: `EventDisplay` already includes `socialSignals.friends` — we just need to render them on the card instead of only in the Social tab.

### 4D. "Friends Going" Quick Filter

Add a "Friends" chip to the FilterStrip quick chips:

```
[This Week] [Weekend] [Concerts] [Friends] [⚙ Filters]
```

When active: filters to only events where at least one friend is Going or Interested. Uses existing `?friendsGoing=true` param.

### 4E. Component Changes

| Component | Change |
|-----------|--------|
| `HomePageContent.tsx` | Remove ViewToggle, single layout, add PlansStrip above feed |
| `ViewToggle.tsx` | DELETE |
| `SocialTab.tsx` | DELETE (functionality absorbed into PlansStrip + inline signals) |
| `SocialSummaryChips.tsx` | DELETE |
| `EventCard.tsx` | Add friend avatar row when socialSignals.friends exists |
| NEW: `PlansStrip.tsx` | Horizontal scroll strip of user's active plans |
| `FilterStrip.tsx` | Add "Friends" quick chip |

### 4F. Data Changes

The `getEventsWithSocialSignals()` query already returns friend data. The `EventDisplay` type already includes it. No schema changes needed — this is purely a UI restructuring.

If performance is a concern (social signals on every card), the data layer already computes this server-side. We just need to pass it through.

### 4G. Definition of Done

- [ ] No tab toggle on home page — single unified feed
- [ ] Plans strip shows at top for logged-in users with plans
- [ ] Every EventCard shows friend avatars + count when friends are attending
- [ ] "Friends" filter chip works
- [ ] SocialTab, ViewToggle, SocialSummaryChips deleted
- [ ] CalendarSidebar still shows on desktop (this doesn't change)
- [ ] Empty state uses Lark voice: "Nights start here. Add a few friends to see who's going." (not a dead end)
- [ ] `qa-reviewer` audit passes

---

## Increment 5: Event Page Hierarchy ✅ COMPLETE

**Goal:** Integrated hero with overlay navigation, 3-state event page architecture (plan/friends/discovery), inline attendance toggles, and state-dependent sticky bar.

**Shipped:** Feb 2026 · Combined with Inc 6 into unified hero redesign + plan-on-event-page. 3 new components created (EventHero, EventPlanPanel, EventContentTabs), 5 components rewritten (EventActionBar, SocialProofCard, ExploreCard, AboutCard, ShareButton).

**Depends on:** Inc 0 (tokens, IconButton for Share/Website), Inc 1 (Dialog + PeopleList for friend modal), Inc 3 (warm CTAs, de-SaaS card treatment already applied)

### 5A. Zone-Based Layout

**Current (top to bottom):**
Back+Share → Hero → Header (badges, title, date, venue) → FriendsAndStatusCard (6 buttons) → Buy+Explore → About

**New (top to bottom):**

```
ZONE 1: IDENTITY
  [← Back]                                    [Share] [⋮]
  [Hero Image]
  [NEW] [CONCERT]                             [SOLD OUT]
  Artist Name
  by Performer Name · With: Supporting Acts
  Fri, Mar 7 · 8:00 PM
  📍 Stubb's, Austin, TX

ZONE 2: ACTIONS (the conversion zone)
  ┌────────────────────────────────────────────────────┐
  │ [★ Interested]    [✓ Going]                        │
  │                                                    │
  │ [████████ Buy Tickets ↗ ████████]                  │  ← full-width, prominent
  │                                                    │
  │ [🔗 Event Website]  [↗ Share]                      │  ← secondary row, icon+text
  └────────────────────────────────────────────────────┘

ZONE 3: SOCIAL PROOF
  ┌────────────────────────────────────────────────────┐
  │ 👤👤👤 3 friends going · 2 interested    [See all] │
  │                                                    │
  │ [View Plan →]  or  [Start Plan]                    │
  │                                                    │
  │ ── Ticket exchange ──                              │
  │ [Need Tickets]  [Selling Tickets]                  │
  └────────────────────────────────────────────────────┘

ZONE 4: EXPLORE
  ┌────────────────────────────────────────────────────┐
  │ [Artist Image]  Artist Name                        │
  │                 "Description from KG..."           │
  │                 [indie rock] [psychedelic]          │
  │                 [Spotify] [YouTube] [Instagram]     │
  └────────────────────────────────────────────────────┘

ZONE 5: ABOUT
  ┌────────────────────────────────────────────────────┐
  │ About                                              │
  │ Event description text...                          │
  │                                                    │
  │ Venue details...                                   │
  └────────────────────────────────────────────────────┘
```

### 5B. Key Design Decisions

1. **Buy Tickets promoted into the action zone.** It's the highest commercial intent — above the fold, full-width, brand-colored button. Currently buried below FriendsAndStatusCard.

2. **Share + Event Website become secondary icon+text buttons.** Not their own row at the top. They live with Buy Tickets in the action zone.

3. **Social proof is its own card.** Friend avatars, plan CTA, and ticket exchange all relate to "people I know and what they're doing." Separated from personal attendance (Interested/Going).

4. **Ticket exchange (Need/Selling) collapsed by default.** Shows as a subtle toggle row within social proof. Only prominent when friends have ticket statuses.

5. **Back button stays top-left.** Universal navigation pattern.

### 5C. Component Changes

| Component | Change |
|-----------|--------|
| `events/[id]/page.tsx` | Restructure layout into 5 zones |
| `FriendsAndStatusCard.tsx` | Split into: AttendanceButtons (Zone 2) + SocialProofCard (Zone 3) |
| `PrimaryCTACard.tsx` | Move into Zone 2 action card, full-width |
| `ShareButton` | Move from top into Zone 2, use IconButton |
| `ExploreCard.tsx` | Stays Zone 4 (no structural change, just cleanup) |
| `AboutCard.tsx` | Stays Zone 5 (no change) |
| NEW: `AttendanceButtons.tsx` | Just Interested/Going, extracted from FriendsAndStatusCard |
| NEW: `SocialProofCard.tsx` | Friends + Plan CTA + Ticket exchange |

### 5D. Definition of Done

- [ ] Buy Tickets visible above the fold on mobile (375px)
- [ ] Interested/Going buttons in action zone (Zone 2)
- [ ] Social proof card separated from attendance
- [ ] Friend avatars tap opens PeopleList modal (using Inc 1 Dialog + PeopleList)
- [ ] Share and Event Website are icon+text buttons, not standalone components
- [ ] Ticket exchange collapsed by default, expandable
- [ ] No decorative emojis in any zone (SVG icons from Inc 0)
- [ ] `qa-reviewer` audit passes

---

## Increment 6: Plan-on-Event-Page ✅ COMPLETE

**Goal:** When a user has a plan for an event, the plan experience lives on the event page itself — not a separate `/squads/[id]` route. Inline plan panel, Plan/Explore tabs, full-width Start Plan CTA.

**Shipped:** Feb 2026 · EventPlanPanel rewritten as fully interactive (status controls, ticket toggle, full member list with organizer remove, meetup inline edit, leave plan). `/squads/[id]` redirects to `/events/[eventId]?tab=plan`. SmartSquadButton, StartPlanModal, and notifications all route to event page. Legacy plan page (SquadPage, SquadPageModal, PlanModeView) deprecated.

**Depends on:** Inc 5 (event page zones — plan panel extends Zone 3)

### 6A. Plan Panel on Event Page

When the user taps "View Plan" in the SocialProofCard (Zone 3), instead of navigating away, a collapsible panel expands inline:

```
ZONE 3: SOCIAL PROOF (expanded with plan)
  ┌────────────────────────────────────────────────────┐
  │ 👤👤👤 3 friends going · 2 interested    [See all] │
  │                                                    │
  │ ┌── Your Plan ──────────────────────────── [▼] ──┐ │
  │ │                                                │ │
  │ │  Members                                       │ │
  │ │  👤 You (organizer)     Going                  │ │
  │ │  👤 Sarah              Interested              │ │
  │ │  👤 Mike               Going                   │ │
  │ │  [+ Invite Friends]                            │ │
  │ │                                                │ │
  │ │  Meetup Details                                │ │
  │ │  📍 Meet at front entrance                     │ │
  │ │  🕐 6:30 PM                                    │ │
  │ │  [Edit Meetup]                                 │ │
  │ │                                                │ │
  │ │  [Share Plan]                                  │ │
  │ └────────────────────────────────────────────────┘ │
  │                                                    │
  │ ── Ticket exchange ──                              │
  │ [Need Tickets]  [Selling Tickets]                  │
  └────────────────────────────────────────────────────┘
```

### 6B. SmartSquadButton Behavior Change

**Current behavior:**
- Mobile: navigate to `/squads/[id]`
- Desktop: open SquadPageModal

**New behavior (both platforms):**
- "Start Plan" → SquadCreationModal (same as now)
- "View Plan" → expand inline Plan Panel on event page
- Deep link `/squads/[id]` still works (for shared links, notifications) but redirects to `/events/[eventId]?plan=open`

### 6C. Data Requirements

The event detail page already fetches `userSquad` (ID only). For the inline plan panel, we need to also fetch:
- Squad members with status
- Meetup details (location, time, notes)
- Whether current user is organizer

This is a small extension to the existing `events/[id]/page.tsx` server query or a client-side fetch when the panel opens.

### 6D. What Stays

- `/squads/[id]` route continues to exist as a landing page for shared plan links
- It redirects logged-in users who are members to the event page with plan open
- For non-members viewing a shared link, it shows a preview + sign-up CTA (future: Inc 7 in Layer 5 — Plan Link Onboarding)

### 6E. Definition of Done

- [ ] "View Plan" expands inline panel on event page (not navigate away)
- [ ] Plan panel shows members, meetup details, invite + share actions
- [ ] "Start Plan" still opens creation modal
- [ ] `/squads/[id]` redirects to event page with `?plan=open` for members
- [ ] Plan panel collapsible (user can close and see the rest of the event page)
- [ ] Share plan texts still work correctly
- [ ] `qa-reviewer` audit passes

---

## Increment 7: Groups Surfacing

**Goal:** Groups become visible on the home page and event pages. Currently they're 3 clicks deep and serve only as a friend-adding mechanism. They should answer "what's my crew doing?"

**Agent:** `ui-polish` (layout), `engagement` (group messaging, empty states), `data-model` (group activity queries), `qa-reviewer` (gate)

**Depends on:** Inc 4 (social-first home — groups surface on the home feed), Inc 1 (PeopleList for group member display)

### 7A. Group Labels on Friend Avatars

When friends from the same group are attending an event, label them:

```
On EventCard:
  👤👤👤 Concert Crew · 3 going

On SocialProofCard (event page):
  Concert Crew (3)
  👤 Sarah  Going
  👤 Mike   Interested
  👤 Jake   Going
```

This surfaces groups without a separate UI — the group context appears naturally on the social signals that already exist.

### 7B. Group Filter

Add "Groups" to the FilterDrawer (Inc 2):

```
Groups
[Concert Crew (5)]  [Sports Gang (3)]  [Work Friends (2)]
```

When active: shows events where any member of that group is Going or Interested.

### 7C. Group Activity in Plans Strip

If the user has groups with upcoming activity, show it in the PlansStrip (Inc 4):

```
YOUR PLANS (2)                    CONCERT CREW (3 events)
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Khruangbin   │ │ Comedy Night │ │ 3 events     │
│ Fri, Mar 7   │ │ Sat, Mar 8   │ │ this week    │
│ 3 friends    │ │ You + 1      │ │ [See all →]  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 7D. Data Requirements

New query: "For a given group, what events are members attending?"

```ts
// src/db/groups.ts (new or extended)
getGroupActivity(groupId: string): Promise<{
  events: Array<{
    event: EventDisplay;
    membersGoing: Array<{ id, displayName, email }>;
    membersInterested: Array<{ id, displayName, email }>;
  }>;
}>
```

This query powers both the group filter and the group activity in PlansStrip.

### 7E. Definition of Done

- [ ] Friend avatar stacks show group labels when applicable
- [ ] Group filter available in FilterDrawer
- [ ] Group activity cards appear in PlansStrip
- [ ] Group member modal uses PeopleList (from Inc 1)
- [ ] Empty state: "Create a group to see what your crew is up to"
- [ ] `qa-reviewer` audit passes

---

## Agent Execution Matrix

| Increment | Primary Agent | Supporting Agents | QA Gate |
|-----------|--------------|-------------------|---------|
| 0: Design Foundation | `ui-polish` | — | `qa-reviewer` |
| 1: Modal & People | `ui-polish` | — | `qa-reviewer` |
| 2: Filter Cleanup | `ui-polish` | `engagement` (copy) | `qa-reviewer` |
| 3: Lark Visual Identity | `ui-polish` | — | `qa-reviewer` |
| 4: Social-First Home | `ui-polish` | `engagement` (empty states), `data-model` (if query changes needed) | `qa-reviewer` |
| 5: Event Page Zones | `ui-polish` | `engagement` (CTA copy) | `qa-reviewer` |
| 6: Plan-on-Event-Page | `ui-polish` | `engagement` (plan messaging), `data-model` (plan data) | `qa-reviewer` |
| 7: Groups Surfacing | `ui-polish` | `engagement` (group copy), `data-model` (group queries) | `qa-reviewer` |

### Agent Workflow Per Increment

```
1. ui-polish reads this spec section
2. ui-polish explores current code (reads components, traces data flow)
3. ui-polish writes implementation plan if touching 3+ files
4. ui-polish implements changes
5. ui-polish screenshots before/after with DevTools MCP
6. qa-reviewer audits: design tokens, auth patterns, data layer, copy, a11y
7. Fix any BLOCKERs
8. Ship increment
```

### What Each Agent Updates After Their Work

| Agent | Updates |
|-------|---------|
| `ui-polish` | `.claude/commands/ui-system.md` (new primitives, tokens), `notes/design/ui-reference.md` |
| `engagement` | `.claude/commands/ux-comms.md` (copy patterns), `notes/reference/customer-comms.md` |
| `data-model` | `.claude/commands/data-model.md` (new queries), `notes/architecture/` |
| `qa-reviewer` | Flags stale standards across all skill docs |

---

## Parallel Work Tracks

While UX increments proceed sequentially (0→1→2→3→4→5→6), other Layer 0/1 work from the revamp synthesis runs in parallel:

```
TRACK A (this spec):     Inc 0 → Inc 1 → Inc 2 → Inc 3 → Inc 4 → Inc 5 → Inc 6 → Inc 7
TRACK B (scraper-ops):   Timezone fixes → Field coverage → Enrichment pipeline
TRACK C (engagement):    alert()→toast → squad leak → CommunitySoonStub → notification wiring
```

Track B and C have zero dependencies on Track A. The `scraper-ops` and `engagement` agents can work on their Layer 0 items from the revamp synthesis while `ui-polish` executes this spec.

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Inc 3 (visual identity) warm gold unfamiliar to users | A/B testable — tokens make rollback easy. Test with real content for readability. |
| Inc 4 (kill tabs) breaks social data loading | SocialTab data fetching moves to page.tsx server component — test thoroughly |
| Inc 6 (plan-on-event-page) increases event page data payload | Lazy-load plan data client-side when panel opens |
| Inc 7 (groups) requires new DB queries | Index exists on GroupMember.groupId — verify with EXPLAIN |
| Design token migration touches many files | Do in Inc 0, not interleaved with UX changes. Mechanical find-replace. |
| 12 modal migrations (Inc 1) is tedious | Batch by similarity: all simple modals first, then complex ones |
| PlansStrip (Inc 3) needs real-time plan data | Client-side fetch, same as current SocialTab — just different UI |
| Monochrome palette is a big visual shift | Legacy aliases in tokens let us migrate incrementally. Components keep working during transition. Test with real content to ensure readability. |
| "Lark" copy in UI before formal rename | Write copy in Lark voice but keep "RyesVP" as the brand name in headers/logos until rename is ready. The voice can shift before the name does. |

---

## Lark Voice Reference (for all agents writing copy)

Source: `references/lark-proposal-final.pdf`

### Vocabulary

| Word | Role | Example |
|------|------|---------|
| Lark | The platform | "I found it on Lark." |
| Plan | The thing you create & share | "I made a plan for Saturday." |
| on Lark | How you reference it | "Who's on Lark for Saturday?" |

### Copy by Surface

| Surface | Example |
|---------|---------|
| Search bar | "What kind of night are we having?" |
| Hero / body | "Find something, bring your people." |
| Hero variant | "Plans with your people, not your inbox." |
| Hero variant | "Your crew, this weekend." |
| Empty state | "Nights start here. Begin by following a few venues or friends." |
| Notification | "Something's happening on Lark." |
| CTA button | "Find Something Tonight" / "Plan with Your People" |
| Share link | "Friday at Mohawk — via Lark" |
| Push notification | "2 friends are in for Saturday on Lark" |

### Personality

> "Lark is the friend who always knows about the show before you do. Not loud, not tryhard — just naturally plugged in and always down to go."

**Do:** Warm, social, brief. Highlight the crew. Use "your people", "friends", "crew", "together."
**Don't:** Sound like a robot, a marketer, a concierge, or a voice assistant. No forced brandspeak.

### "On a Lark" Moment

The phrase "on a lark" (spontaneous adventure) appears **once**, on the onboarding hero screen:

> **Let's go on a lark.**
> *lark / lärk / noun: a spontaneous adventure. The kind of unplanned night that turns into the best story.*

This is the only place the definition appears. Never in marketing copy, push notifications, or UI.

---

## Success Criteria (Post-Inc 7)

After all increments ship:

1. **Home page shows social signal in < 1 second** — no tab switching needed
2. **Event page has clear action hierarchy** — Buy above fold, social proof below
3. **Plans live on event pages** — no navigation dead-ends
4. **Groups surface naturally** — users see group activity without hunting for it
5. **Every modal is consistent** — same close behavior, same styling, same accessibility
6. **Zero hardcoded colors** — everything traces to tokens or constants
7. **FilterStrip is < 1 row on mobile** — no filter wall before events
8. **Design system compliance > 95%** — up from ~70% today
9. **Three-tier CTA hierarchy** — dark (structural), warm gold (engagement), green (state only). No green CTAs.
10. **De-SaaS aesthetic** — no card shadows, editorial whitespace, unified typographic badges
11. **Lark voice in all copy** — warm, social, "plugged-in friend" tone everywhere
