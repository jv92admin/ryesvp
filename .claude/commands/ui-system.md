# UI System

You are working on the user interface: components, styling, layout, or responsive design.

## Lark Visual Direction

The UI follows the Lark brand identity: **monochrome canvas + warm engagement layer**. Read `notes/specs/ux-revamp-audit.md` (Resolution section) and `notes/design/ui-reference.md` (Lark Visual Direction section) for full rationale.

### CTA Hierarchy (Three Tiers)

| Tier | Color | Token | When |
|------|-------|-------|------|
| **Structural** | Dark `#171717` | `--action-primary` | Buy Tickets, Done, Close, Get Started |
| **Engagement** | Warm gold `#B45309` | `--action-engage` | Start Plan, Invite, active filter chips, Friends filter |
| **Signal** | Green/Amber/Red | `--signal-*` | Going badge, Interested badge — **never a CTA** |

**Green is NEVER an action color.** It is a state indicator only (Going, Confirmed). If you're about to make something green and clickable, use `--action-engage` (warm gold) for social actions or `--action-primary` (dark) for structural actions.

### De-SaaS Cards

- **Mobile:** No `shadow-sm`. Whitespace + `border-b border-[var(--border-default)]` between cards.
- **Desktop:** `border border-transparent hover:border-[var(--border-default)]` — borders on hover only.
- Shadows are SaaS. Whitespace and borders are editorial.

### Unified Badges

All status markers (NEW, PRESALE, SOLD OUT) use one treatment: `font-semibold uppercase tracking-wide text-[10px]`, monochrome. Category badges keep subtle color tint but match sizing.

## Design Tokens (Source of Truth: `src/app/globals.css`)

```css
/* SURFACES */
--surface-bg: #FAFAFA;              /* page background */
--surface-card: #FFFFFF;            /* card / elevated */
--surface-inset: #F5F5F5;           /* recessed areas, input backgrounds */

/* TEXT */
--text-primary: #171717;            /* headlines, body */
--text-secondary: #525252;          /* supporting text */
--text-muted: #A3A3A3;             /* hints, placeholders */

/* BORDERS */
--border-default: #E5E5E5;          /* card borders, dividers */
--border-strong: #D4D4D4;           /* hover borders, emphasis */

/* ACTION — structural (dark) */
--action-primary: #171717;          /* Buy Tickets, Done, Close, Get Started */
--action-primary-hover: #404040;
--action-primary-text: #FFFFFF;

/* ACTION — engagement (warm gold) */
--action-engage: #B45309;            /* Start Plan, Invite, active chips */
--action-engage-hover: #92400E;
--action-engage-text: #FFFFFF;
--action-engage-light: #FFFBEB;      /* warm glow for active chip backgrounds */

/* SIGNALS — state only, never CTAs */
--signal-going: #16A34A;            /* Going badge */
--signal-going-light: #DCFCE7;      /* Going background tint */
--signal-interested: #F59E0B;       /* Interested badge */
--signal-interested-light: #FEF3C7; /* Interested background tint */
--signal-danger: #DC2626;           /* errors, Leave Plan */
--signal-danger-hover: #B91C1C;
--signal-info: #3B82F6;             /* links, informational */

/* LEGACY ALIASES (prefer new tokens; remove when zero references) */
--brand-primary → --signal-going
--brand-primary-light → --signal-going-light
--brand-border → --border-default
```

**Utility classes:** `.btn-primary` (dark), `.btn-engage` (warm gold), `.btn-going` (green state), `.btn-danger` (red).

## Shared Primitives (`src/components/ui/`)

| Component | Variants | Usage |
|-----------|----------|-------|
| `Button` | primary, secondary, ghost, danger | Sizes: xs, sm, md, lg. Supports `loading` prop |
| `Badge` | count, status, label | Colors: default, primary, danger, warning, info, success |
| `StatusBadge` | GOING, INTERESTED, NEED_TICKETS, HAVE_TICKETS | User event attendance display |
| `Chip` | toggle, tag, status, info | Sizes: xs, sm, md. Supports `active` state + `onRemove` |
| `Toast` | success, info, error | Via `useToast()` context. Single toast at a time, 8s default |
| `Dialog` | — | Compound component: Dialog, DialogContent, DialogHeader, DialogTitle |
| `FriendAvatarStack` | sm, md | Overlapping avatars (max 3 visible), "+N" overflow |

Check these exist before creating new UI primitives. Prefer extending over duplicating.

## Brand Components (`src/components/brand/`)

- `RyesVPLogo` — SVG square logo (R, Y-checkmark, P)
- `RyesVPWordmark` — Text "RyesVP" with colored Y and V
- `RyesVPBrand` — Combined logo + wordmark for header

## Avatar System (`src/lib/avatar.ts`)

- `getAvatarStyle(userId)` — Deterministic gradient background from user ID hash (12 gradient pairs)
- `getInitials(displayName, email)` — 1-2 character initials
- `getDisplayName(displayName, email)` — Falls back to email username

## Toast Notifications

```typescript
const { showToast } = useToast();
showToast({
  message: 'Plan created!',
  type: 'success',
  action: { label: 'View', onClick: () => router.push(`/squads/${id}`) },
});
```

- Wrap app in `ToastProvider` (already done in layout)
- Single toast at a time (last wins)
- 8s auto-dismiss (configurable via `duration`)
- Fixed bottom-4 on mobile, centered on desktop

## Composition Pattern

```
Primitives (Button, Badge, Chip, Toast, Dialog)
    ↓
Components (EventCard, SocialEventCard, FriendsAndStatusCard, SquadMemberList)
    ↓
Sections (SocialSectionA/B, PlanModeView, DayOfModeView)
    ↓
Pages (HomePageContent, SquadPage, UserProfileContent)
```

Build from existing primitives. Create new primitives only when a pattern repeats 3+ times.

## Responsive Patterns (Mobile-First)

```
Padding:     p-4 sm:p-5 sm:p-6
Images:      w-16 h-16 sm:w-20 sm:h-20
Typography:  text-sm sm:text-base
Grid:        grid grid-cols-1 sm:grid-cols-2
Sidebar:     hidden lg:block lg:w-80
Dropdowns:   fixed sm:absolute top-14 sm:top-auto
Content:     max-w-6xl mx-auto (page width)
Squad page:  max-w-lg mx-auto px-4 py-6
```

Always design mobile-first. Desktop is the enhancement.

## Design Rules

- No decorative emojis — use SVG icons
- Title Case for button CTAs ("Start Plan", "Add Friend")
- Sentence case for headers ("Your events", "Friends going")
- **Warm gold for social actions** (Start Plan, Invite, active chips) — `--action-engage`
- **Dark for structural actions** (Buy, Done, Close, Get Started) — `--action-primary`
- **Green for state only** (Going badge, Confirmed status) — never a CTA
- **No shadows on cards** — whitespace separators on mobile, hover borders on desktop
- Optimistic updates — UI responds immediately before API confirms
- Sticky header with z-50, border using `var(--border-default)`
- Input focus ring: `focus:ring-[var(--action-engage)]` (warm gold, not green)

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens, utility classes, animations |
| `src/components/ui/*.tsx` | Shared primitives |
| `src/components/brand/*.tsx` | Logo, wordmark |
| `src/lib/avatar.ts` | Avatar colors + initials |
| `src/contexts/ToastContext.tsx` | Toast provider + hook |
| `notes/design/ui-reference.md` | Full design system documentation |
| `notes/specs/ux-revamp-spec.md` | UX revamp spec with increment details |
| `notes/specs/ux-revamp-audit.md` | Design audit with Lark Visual Identity resolution |
