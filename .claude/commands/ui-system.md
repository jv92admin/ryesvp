# UI System

You are working on the user interface: components, styling, layout, or responsive design.

## Design Tokens (CSS Variables)

Defined in `src/app/globals.css`, available as Tailwind colors:

```css
--brand-primary: #16A34A        /* Green-600 — primary actions, "Go" buttons */
--brand-primary-hover: #15803D  /* Green-700 */
--brand-primary-light: #DCFCE7  /* Green-100 — light backgrounds */
--brand-black: #171717          /* Neutral-900 — text, headers */
--brand-gray: #FAFAFA           /* Neutral-50 — card backgrounds */
--brand-gray-100: #F5F5F5       /* Neutral-100 */
--brand-border: #E5E5E5         /* Neutral-200 — borders */
--brand-danger: #DC2626         /* Red-600 — destructive actions */
--brand-danger-hover: #B91C1C   /* Red-700 */
--brand-warning: #F59E0B        /* Amber-500 */
--brand-info: #3B82F6           /* Blue-500 */
```

Always use CSS variables or their Tailwind equivalents. Never hardcode hex values.

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

- `SocialEventCard` (`src/components/social/SocialEventCard.tsx`) — shared event card for social feed sections. Used by SocialSectionA and SocialSectionB.
- `EventCard` uses SVG `CategoryIcons` and `PresaleIcons` for category fallback images and presale indicators (no emoji icons).
- Build from existing primitives. Create new primitives only when a pattern repeats 3+ times.

## Responsive Patterns (Mobile-First)

Common Tailwind recipes used throughout:

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
- Green for positive actions, red for destructive, gray for secondary
- Optimistic updates — UI responds immediately before API confirms
- Sticky header with z-50, border using `var(--brand-border)`
- Input fields: `text-gray-900 placeholder:text-gray-400`

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens, utility classes, animations |
| `src/components/ui/*.tsx` | Shared primitives |
| `src/components/brand/*.tsx` | Logo, wordmark |
| `src/lib/avatar.ts` | Avatar colors + initials |
| `src/contexts/ToastContext.tsx` | Toast provider + hook |
| `notes/design/ui-reference.md` | Full design system documentation |
