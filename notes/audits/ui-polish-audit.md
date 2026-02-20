# UI Polish Audit

**Date:** 2026-02-19
**Scope:** Full codebase scan of `src/components/`, `src/app/`, and `src/lib/`
**Reference:** `.claude/agents/ui-polish.md`, `notes/design/ui-reference.md`, `src/app/globals.css`

---

## Blockers (Must Fix)

These violations break the design system contract. They will produce visual inconsistencies or make future theming impossible.

### B1. Hardcoded External Brand Colors (5 files, ~15 instances)

No external brand colors have been extracted to `src/lib/constants/`. The directory `src/lib/constants/` does not exist at all.

| File | Line(s) | Color | Meaning |
|------|---------|-------|---------|
| `EventCard.tsx` | 264 | `#1DB954`, `#1ed760` | Spotify green, Spotify hover |
| `EventEnrichment.tsx` | 70 | `#1DB954`, `#1ed760` | Spotify green, Spotify hover |
| `ExploreCard.tsx` | 97, 110, 121, 157, 168, 179 | `#1DB954`, `#1ed760`, `#FF0000`, `#cc0000`, `#833AB4`, `#FD1D1D`, `#F77737` | Spotify, YouTube, Instagram gradient |
| `PrimaryCTACard.tsx` | 22 | `#01579B` | Ticketmaster blue |
| `PerformerModal.tsx` | 215 | `#1DB954` | Spotify text color |

**Fix:** Create `src/lib/constants/externalBrands.ts` with:
```ts
export const EXTERNAL_BRANDS = {
  SPOTIFY: { bg: '#1DB954', hover: '#1ed760' },
  YOUTUBE: { bg: '#FF0000', hover: '#cc0000' },
  INSTAGRAM: { gradient: 'from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
  TICKETMASTER: { bg: '#01579B' },
} as const;
```

### B2. Duplicated Category Color Maps (2 files)

Identical `categoryColors` maps are defined inline in two places:

- `src/components/EventCard.tsx:171` (7 entries)
- `src/app/events/[id]/page.tsx:69` (7 entries)

Additionally, `events/[id]/page.tsx:79` defines a `categoryEmojis` map (violates no-decorative-emoji rule, see B4).

**Fix:** Extract to `src/lib/constants/categoryColors.ts`. Single import, single source of truth.

### B3. Duplicated Status/Ticket Configuration Maps (6 files, ~8 inline maps)

Status color mappings (GOING/INTERESTED/NEED_TICKETS/HAVE_TICKETS) are defined separately in each file:

| File | Variable | Line(s) |
|------|----------|---------|
| `ui/StatusBadge.tsx` | `STATUS_CONFIG` | 10 |
| `squad/SquadMemberList.tsx` | `STATUS_DISPLAY`, `TICKET_DISPLAY` | 41, 48 |
| `squad/SquadCreationModal.tsx` | `statusConfig` (x2) | 349, 412 |
| `squad/SquadInviteModal.tsx` | `statusConfig` | 265 |
| `PerformerModal.tsx` | `TYPE_COLORS` | 46 |
| `AttendanceButton.tsx` | `STATUS_CONFIG` | 13 |
| `ui/Badge.tsx` | `statusConfig` | 121 |

**Fix:** Extract to `src/lib/constants/statusColors.ts` with shared types and color/icon mappings. Each component imports and potentially extends.

### B4. Decorative Emojis Used as UI Chrome (12+ components)

The design system rule is: "SVG icons only. No decorative emojis." User-generated content and share text templates are exempted.

**Violations in UI chrome (must fix):**

| File | Line(s) | Emoji | Context |
|------|---------|-------|---------|
| `AboutCard.tsx` | 60 | `📍` | Venue location icon |
| `CommunitySoonStub.tsx` | 24, 32, 40, 48 | `🚧 🎫 🔍 👥` | Section icons |
| `DayOfModeView.tsx` | 142, 213, 227, 251, 261, 271, 281 | `📍 🌤️ 📋 🎟️ ⚡ 🗺️ 🚗` | Location, weather, checklist, tickets, actions, maps, uber |
| `StatusBadge.tsx` | 22, 27, 77-78 | `🎫 🎟️ 👥` | Ticket status icons, friend count |
| `SquadMemberList.tsx` | 49 | `🎫` | Ticket icon |
| `SquadCreationModal.tsx` | 352-353, 415-416 | `🔍 🎫` | Status icons |
| `SquadInviteModal.tsx` | 268-269 | `🔍 🎫` | Status icons |
| `SquadSnapshot.tsx` | 121, 124, 198, 200 | `🎫 🎫👥` | Ticket icons |
| `SquadLogistics.tsx` | 167 | `📍` | "Where" label |
| `SquadStops.tsx` | 251 | `📍` | Itinerary header |
| `CalendarSidebar.tsx` | 130, 152, 157, 208 | `⚡ 🎫 👥` | Presale, on-sale, friends |
| `EventSocialSection.tsx` | 28, 97 | `👥 🎭` | Friends tab, community |
| `AttendanceButton.tsx` | 23, 27 | `🎫 🎟️` | Button labels |
| `events/[id]/page.tsx` | 79-86, 123, 181 | `🎵😂🎭🎬🏆🎪📅 📍` | Category icons, location |
| `StartPlanModal.tsx` | 435 | `📅` | Fallback event image |
| `UserProfileContent.tsx` | 446 | `📅` | Calendar icon |
| `invite-required/page.tsx` | 144 | `🎟️` | Ticket icon |

**Acceptable (user-facing share text, not UI chrome):**
- `ShareButton.tsx` and `ShareIconButton.tsx` (emojis in share message copy)
- `squadShareText.ts` (emojis in share text templates)
- `calendar.ts` (emojis in calendar export descriptions)
- `presales.ts` (emojis in label strings for calendar exports)

**Fix:** Replace all UI-chrome emojis with SVG icons. `EventCard.tsx` already has `CategoryIcons` and `PresaleIcons` as SVG maps -- follow that pattern. Create a shared icon component set or extend the existing SVG maps.

### B5. `bg-emerald-500` Bypassing `--brand-primary` (2 files)

The "NEW" badge uses `bg-emerald-500` instead of `bg-[var(--brand-primary)]`. Emerald-500 is `#10b981`, while `--brand-primary` is `#16A34A` (green-600). These are different greens.

| File | Line | Class |
|------|------|-------|
| `EventCard.tsx` | 220 | `bg-emerald-500` |
| `events/[id]/page.tsx` | 131 | `bg-emerald-500` |

**Fix:** Replace with `bg-[var(--brand-primary)]` for brand consistency.

---

## Suggestions (Should Fix)

These are inconsistencies that degrade visual coherence but are not broken. Fix when touching these files.

### S1. `border-green-*` Instead of Brand Token Derivatives (30+ instances across 15+ files)

`border-green-200`, `border-green-300`, `border-green-400` appear extensively. The design system expects borders to derive from `--brand-border` (#E5E5E5) or `--brand-primary-light` (#DCFCE7). Raw Tailwind green classes bypass theming.

**Most impactful files:**
- `SocialSectionA.tsx:58,64` -- `border-green-200` in highlighted sections
- `SocialSectionB.tsx:59,65` -- same
- `SmartSquadButton.tsx:112-113` -- `border-green-300`, `hover:border-green-400`
- `StartPlanButton.tsx:24-25, 31-32` -- same pattern
- `Chip.tsx:53,54,58,69,70` -- toggle/tag variant borders
- `CommunitySoonStub.tsx:20,64,84` -- border and focus ring
- `CalendarSidebar.tsx:184,217,226` -- CTA and info cards
- `SocialEngagementPanel.tsx:97,131,152` -- engagement cards
- `GroupsTab.tsx:169` -- create group button
- `CommunitiesContent.tsx:165` -- join community button
- `SquadCreationModal.tsx:430` -- friend row
- `SquadSnapshot.tsx:65,218` -- plan card
- `SquadMemberList.tsx:199` -- invite button
- `SquadTicketsSection.tsx:147` -- covered state
- `CreateListModal.tsx:128` -- selected friend
- `FriendsAndStatusCard.tsx:275` -- have tickets state

**Fix:** Introduce a `--brand-primary-border` token (e.g., `#BBF7D0` / green-200 equivalent) in `globals.css` and use `border-[var(--brand-primary-border)]` consistently. This preserves the green tint while being themeable.

### S2. `text-blue-600` Instead of `--brand-info` (5 instances)

`--brand-info` is `#3B82F6` (blue-500). `text-blue-600` is `#2563EB`. They are slightly different.

| File | Line | Context |
|------|------|---------|
| `EventCard.tsx` | 233 | Active presale text |
| `events/[id]/page.tsx` | 193 | "Visit event website" link |
| `AddFriendCard.tsx` | 177 | Section header |
| `about/page.tsx` | 86 | Section header |
| `invite-required/page.tsx` | 197 | Link text |

**Fix:** Replace with `text-[var(--brand-info)]`.

### S3. Inconsistent `border-gray-*` Usage (100+ instances)

Three different gray border values are used interchangeably:
- `border-gray-100` -- lighter (internal dividers)
- `border-gray-200` -- standard (card borders, section dividers)
- `border-gray-300` -- heavier (form inputs, emphasized borders)

The design token `--brand-border` maps to `#E5E5E5` (closest to `gray-200`). The codebase has no consistent convention for when to use lighter vs. standard.

**Proposed convention:**
- `border-[var(--brand-border)]` for all standard card/section borders (replaces `border-gray-200`)
- `divide-gray-100` for internal list dividers (lighter, acceptable)
- `border-gray-300` only for form input borders (heavier for affordance)

This is a large surface area change (100+ instances). Handle opportunistically per-file.

### S4. `bg-blue-600` in Button Legacy Variant

`src/components/ui/Button.tsx:51-56` has a `legacy-primary` variant using `bg-blue-600` and `hover:bg-blue-700`. If this variant is still in use, it should either map to `--brand-info` or be removed if deprecated.

### S5. Direct Tailwind Color Classes in Status Components

Several components use raw Tailwind color classes for status semantics:

| File | Classes | Context |
|------|---------|---------|
| `StatusBadge.tsx:14` | `bg-emerald-100 text-emerald-700` | GOING status |
| `StatusBadge.tsx:19` | `bg-amber-100 text-amber-700` | INTERESTED status |
| `StatusBadge.tsx:24` | `bg-blue-100 text-blue-700` | NEED_TICKETS status |
| `StatusBadge.tsx:29` | `bg-purple-100 text-purple-700` | HAVE_TICKETS status |
| `SquadStatusControls.tsx` | `bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`, `bg-red-100 text-red-700` | Status toggle |
| `FriendsAndStatusCard.tsx:275` | `bg-green-100 text-green-700 border border-green-200` | HAVE_TICKETS |
| `EventCardActions.tsx:96` | `bg-amber-500` | INTERESTED active button |
| `CombinedAttendanceModal.tsx` | `bg-green-600`, `bg-yellow-600` | Status dots |

These are semantic status colors documented in `ui-reference.md`. Once extracted to `src/lib/constants/statusColors.ts` (see B3), all components should import from there rather than defining inline.

### S6. Inconsistent Avatar Color Palette in PerformerModal

`PerformerModal.tsx:76` defines an inline array of 14 avatar fallback colors using raw Tailwind classes (`bg-emerald-500`, `bg-blue-500`, `bg-purple-500`, etc.). This should be centralized or use a hash-based color function for consistency.

### S7. `focus:ring-green-500` Instead of Brand Token

Several form/interactive elements use `focus:ring-green-500`:
- `CommunitySoonStub.tsx:64`
- `ProfileContent.tsx` (focus ring)

**Fix:** Use `focus:ring-[var(--brand-primary)]` for consistent focus indicators.

### S8. Outdated Copy in CommunitySoonStub

`CommunitySoonStub.tsx` contains "Expected: Early 2025" timeline text. Given the current date is February 2026, this is stale and should be updated or removed.

### S9. `border-l-emerald-400` / `border-l-blue-400` in AddFriendCard

`AddFriendCard.tsx:124-126` uses `border-l-emerald-400` and `text-emerald-600` for the "friends" incoming section. Lines 175-177 use `border-l-blue-400` and `text-blue-600` for "people" section. These should map to brand tokens.

### S10. `bg-red-500` for Notification Badge

`FriendsContent.tsx:159` uses `bg-red-500` for the request count badge. Should use `bg-[var(--brand-danger)]` (#DC2626 = red-600, close but not identical to red-500).

### S11. Header Inline Style

`Header.tsx` uses inline `style={{ borderColor: 'var(--brand-border)' }}` instead of Tailwind class `border-[var(--brand-border)]`. While functionally equivalent, the Tailwind class approach is the codebase convention.

### S12. `bg-blue-50/50` for Notification Background

`NotificationBell.tsx:172` uses `bg-blue-50/50` for unread notification background. Consider using a design token or at minimum documenting this as an intentional accent.

---

## Good Practices Observed

The codebase is NOT a mess. Many components already follow the design system correctly. Credit where due:

1. **SocialEventCard.tsx** -- Clean, well-structured, uses `var(--brand-primary)` and `var(--brand-primary-light)` correctly. No hardcoded colors. Good template for other social components.

2. **Button.tsx (primary variants)** -- Primary, secondary, ghost, and danger variants all use CSS custom properties from `globals.css`. Correct hover states. Only the `legacy-primary` variant deviates.

3. **Toast.tsx** -- Uses `var(--brand-primary)` for success variant, `var(--brand-danger)` for error. Clean animation. Follows design system precisely.

4. **FriendAvatarStack.tsx** -- Uses avatar utility, correct sizing variants (sm/md), overflow badge uses gray-500 (acceptable neutral).

5. **SearchInput.tsx** -- Uses `focus:ring-[var(--brand-primary)]` for focus state. Correct token usage.

6. **Dialog.tsx (ui/)** -- Clean implementation. Overlay, content, header, title all well-structured. Uses `border-gray-200` (should be token, but structurally sound).

7. **DateChips.tsx / CategoryChips.tsx** -- Both use the `ToggleChip` primitive correctly. No inline color overrides.

8. **ViewToggle.tsx** -- Clean segmented control using `var(--brand-primary)`.

9. **SquadGuestsSection.tsx / SquadTicketsSection.tsx** -- Mostly good use of `ToggleChip`, `Chip`, and `Button` primitives from `src/components/ui/`.

10. **EventCard.tsx CategoryIcons / PresaleIcons** -- SVG icon maps are the RIGHT pattern. These should be the model for replacing all decorative emojis.

11. **`globals.css` design tokens** -- Well-organized `@theme inline` block with semantic naming. Utility classes (`.btn-primary`, `.btn-danger`) follow token system. Toast animation is the only custom keyframe. Clean.

---

## Missing Components

### Missing Entirely

| Component | Where Needed | Notes |
|-----------|-------------|-------|
| **Input** | `CommunitySoonStub.tsx`, `StartPlanModal.tsx`, `SquadLogistics.tsx`, `ProfileContent.tsx` | Ad-hoc `<input>` with inconsistent styling. Need shared Input with label, error state, focus ring using brand tokens. |
| **Checkbox** | Not currently used but needed for squad guest management | No shared primitive exists. |
| **Select** | Not currently used inline but will be needed for filters | No shared primitive exists. |
| **IconButton** | `CombinedAttendanceModal.tsx` close button, share buttons | Close/action buttons are inline `<button>` with inconsistent sizing and missing aria-labels. |

### Missing Constants/Utilities

| Constant File | Purpose | Status |
|--------------|---------|--------|
| `src/lib/constants/externalBrands.ts` | Spotify, YouTube, Instagram, Ticketmaster colors | Does not exist. `src/lib/constants/` directory does not exist. |
| `src/lib/constants/categoryColors.ts` | Event category color/icon mappings | Does not exist. Duplicated inline in 2 files. |
| `src/lib/constants/statusColors.ts` | GOING/INTERESTED/NEED_TICKETS/HAVE_TICKETS color/icon mappings | Does not exist. Duplicated inline in 6+ files. |

### Accessibility Gaps

Only **13 `aria-label` or `role` attributes** exist across all ~90 component files. This is critically low.

**Immediate gaps:**
- `CombinedAttendanceModal.tsx` -- close button (`x`) has no `aria-label`
- All `FriendAvatarStack` click targets have no `aria-label` describing the action
- `SmartSquadButton` / `StartPlanButton` interactive elements lack descriptive labels
- `EventCardActions.tsx` attendance buttons lack `aria-label` (rely on visual emoji-text which screen readers may misread)
- No skip-navigation link
- No landmark roles on main content areas
- Modal focus trapping is not evident (Dialog.tsx may handle this via Radix, but custom modals like `CombinedAttendanceModal` do not)
- `CalendarSidebar.tsx` presale timeline items lack semantic structure

---

## Summary

### By the Numbers

| Category | Count |
|----------|-------|
| Hardcoded hex colors | ~15 instances in 5 files |
| Duplicated color/config maps | ~8 maps across 6+ files |
| Decorative emoji violations | ~60 instances across 16 components |
| `border-green-*` bypassing tokens | ~35 instances across 15+ files |
| `text-blue-600` mismatches | 5 instances |
| `bg-emerald-500` mismatches | 2 instances |
| Missing `aria-label`s | Dozens (only 13 exist total) |
| Missing shared primitives | 4 (Input, Checkbox, Select, IconButton) |
| Missing constant files | 3 (externalBrands, categoryColors, statusColors) |

### Priority Order

1. **Create `src/lib/constants/`** -- externalBrands, categoryColors, statusColors. This is the foundation that unblocks deduplication across all components. (~2 hours)

2. **Replace decorative emojis with SVG icons** -- Follow the `CategoryIcons`/`PresaleIcons` pattern from `EventCard.tsx`. This is the most visible violation and affects ~16 components. (~4 hours)

3. **Deduplicate status config maps** -- Once `statusColors.ts` exists, update `StatusBadge.tsx`, `SquadMemberList.tsx`, `SquadCreationModal.tsx`, `SquadInviteModal.tsx`, `AttendanceButton.tsx`, `Badge.tsx`. (~2 hours)

4. **Fix `bg-emerald-500` and `text-blue-600` mismatches** -- Quick wins, 7 instances total. (~30 min)

5. **Introduce `--brand-primary-border` token** -- Add to `globals.css`, then migrate `border-green-*` instances. Do opportunistically. (~1 hour for token + 3 hours for full migration)

6. **Build shared Input primitive** -- Needed before any new form-heavy features. (~2 hours)

7. **Accessibility pass** -- Add `aria-label`s to all interactive elements, ensure modal focus trapping, add skip-nav. (~4 hours)

### What's Working

The design token system in `globals.css` is solid. The shared primitives that exist (Button, Badge, Chip, Toast, Dialog, FriendAvatarStack) are well-built and correctly tokenized. New components like `SocialEventCard.tsx` follow the system faithfully. The problem is not architecture -- it is coverage. The tokens and primitives exist but are not consistently applied across the full component tree, and centralized constants for category/status/brand colors have never been extracted.

The codebase is roughly 70% compliant with its own design system. The remaining 30% is concentrated in: (a) status-related components, (b) external link buttons, (c) squad/plan UI, and (d) the event detail page. Fixing the constants layer first will make all downstream fixes mechanical.
