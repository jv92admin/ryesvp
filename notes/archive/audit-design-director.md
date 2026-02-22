# Design Director Audit — February 2026

**Auditor:** Design Director Agent (Lark pipeline)
**Scope:** Full design system review: spec vs. implementation, visual direction, gaps, opportunities
**Verdict:** The spec is ambitious and philosophically sharp. The codebase has not even begun executing it. What is live today is a light-mode app with colored category tags, green/amber signal colors, warm gold engagement buttons, colorful avatar gradients, and a white header bearing the old RyesVP brand mark. The Lark design system exists only as a document.

---

## What's Working

### 1. The philosophical frame is genuinely strong

The "dark room that lets event art be the color" concept is a real idea, not a mood board platitude. It creates concrete, testable constraints: is this element monochrome? Does it compete with event imagery? Would it look right on a black flyer? These are design decisions you can actually enforce in code review. Most design systems at this stage are just Figma token dumps. This one has a point of view.

### 2. The elevation model is correct

No shadows, surface stepping only (`--bg-primary` -> `--bg-elevated` -> `--bg-surface` -> `--bg-hover`). This is a disciplined decision that holds up. The four-level system is enough for every component the app will need. Shadows on dark UIs always look wrong — they create grey smudges instead of spatial depth. The flat, graphic, print-inspired approach is the right call.

### 3. Single-accent philosophy

Near-white (`#E8E8E8`) as the accent color on `#0A0A0A` is a strong, defensible choice. It produces roughly 16:1 contrast ratio. It means the only real color in the UI comes from event imagery. This is the kind of constraint that creates a recognizable brand identity. It is also extremely hard to execute, which is both its strength and its risk.

### 4. The motion language is restrained and correct

"Earn every animation" is the right philosophy for a utility-oriented app. The duration/easing table is sensible. The reduced-motion handling in `globals.css` is already implemented. The stagger limits (max 5 cards) show awareness of performance budgets.

### 5. The CTA hierarchy simplification is right

Collapsing from three tiers (structural dark, engagement gold, signal colors) to two (filled accent, outlined secondary) is the correct move. The old system had too many competing CTAs on every surface.

### 6. Token naming is clear and intentional

`--bg-elevated`, `--border-subtle`, `--text-muted` — these names communicate intent, not value. A developer can read `--border-subtle` and know it means "barely there." This is better than most token systems.

---

## What's Questionable

### 1. The spec is fiction — the codebase is a completely different app

This is the most critical finding. The Lark design system describes a dark-mode, monochrome app. The actual codebase is a light-mode app with:

- **White backgrounds everywhere:** `bg-white` in `EventCard.tsx` (line 180), `EventSocialSection.tsx` (line 21), `Header.tsx` (line 12), `EventHero.tsx` pill styles (line 90)
- **Colored category tags:** `categoryColors.ts` maps categories to `text-purple-700`, `text-amber-700`, `text-pink-700`, `text-red-700`, `text-blue-700`, `text-orange-700` — the design system explicitly says ALL categories should be `--text-secondary`, monochrome, no color-coding
- **Green "Going" signals:** `statusColors.ts` uses `--signal-going` (green `#16A34A`) and `--signal-going-light` (green tint `#DCFCE7`) — the Lark system says "Going" is `--accent` (near-white fill)
- **Amber "Interested" signals:** `--signal-interested` (amber `#F59E0B`) and tints — should be `transparent` + `--border-visible`
- **Warm gold engagement buttons:** `--action-engage: #B45309` with `--action-engage-light: #FFFBEB` warm glows in `EventActionBar.tsx`, `SocialProofCard.tsx`, `FilterStrip.tsx` — all should be `--accent` monochrome
- **Colorful avatar gradients:** 12 gradient color pairs in `avatar.ts` — should be monochrome `--bg-surface` with `--text-secondary` initials
- **Blue for NEED_TICKETS, purple for HAVE_TICKETS** in `statusColors.ts` — NEED_TICKETS should be `--status-need-ticket` (`#FF4444`, the only red), HAVE_TICKETS should be `--accent`
- **Old RyesVP logo still in use:** `Header.tsx` imports `RyesVPLogo` which renders an RVYP grid with a green checkmark — the design system says this is "gone entirely"

The `globals.css` file defines the OLD token system as the primary tokens and exposes them to Tailwind. The Lark tokens are nowhere in the actual `:root` declaration. The migration map in `ui-system.md` lists everything that needs to change, but zero migration has occurred.

**This isn't a migration gap. This is a complete rewrite that hasn't started.**

### 2. The Chip component is a color circus

`Chip.tsx` has SIX color variants (`default`, `primary`, `accent`, `category`, `warning`, `success`), each with active/inactive states using amber, blue, green, and white backgrounds. It directly contradicts the design system's stated rule: "Components like Button, Chip, and Badge should NOT accept arbitrary color props."

The Lark system specifies exactly two chip states:
- **Default (unselected):** `--bg-surface` background, `1px solid --border-subtle`, `--text-secondary`
- **Active (selected):** `--accent` background, `--text-inverse`

The current Chip component would need to be rewritten, not migrated. The six-color variant system embeds the old brand's color philosophy into the component API itself.

### 3. The Button component still has `signal` and `engage` variants

`Button.tsx` exposes `signal` (green) and `engage` (warm gold) as variant options. These variants should not exist in the Lark system. The target is two variants: `primary` (accent-filled) and `secondary` (outlined). The `danger` variant stays. `signal` and `engage` are ghosts of the old brand.

### 4. `globals.css` is fighting itself

The file defines old tokens (`--surface-bg`, `--surface-card`, `--action-engage`, `--signal-going`, etc.) as the primary system, then has a `@theme inline` block that exposes them to Tailwind, then has legacy aliases that point to signal tokens. It also has `.btn-going` and `.btn-engage` utility classes — both flagged for deletion in the design system spec.

Meanwhile, none of the Lark tokens (`--bg-primary`, `--bg-elevated`, `--accent`, etc.) are defined anywhere in the actual CSS. The easing curves and motion tokens are defined (good), but the entire color and surface system exists only in the spec document.

### 5. The monochrome rule may be too absolute for one specific case

The design system says: no colored category tags, period. I agree with this in general. But the Spotify green icon in `EventCard.tsx` (line 251) is an external brand mark, not a Lark UI element. The spec should explicitly carve out: **external brand marks (Spotify, Ticketmaster, etc.) retain their brand colors.** This is already handled correctly in `externalBrands.ts` but is not acknowledged in the design system document, which creates confusion.

### 6. The type system specifies custom fonts but ships Geist Sans

The design system spec lists GT America, Sohne, Space Grotesk, and Instrument Sans as headline typeface candidates. The actual app uses Geist Sans everywhere (set in `globals.css` body and `@theme inline`). The spec body copy recommendation is a system font stack, but the app uses Geist for everything.

This isn't necessarily wrong — Geist is clean and performs well. But the spec explicitly calls for "a typeface with character. Not a geometric sans-serif. Something with slight irregularity, warmth, or a hand-set quality." Geist is about as geometric and machine-perfect as they come. The spec and the implementation have different typographic philosophies, and nobody has resolved which wins.

### 7. The `--text-muted` contrast ratio is dangerously low

`--text-muted: #666666` on `--bg-primary: #0A0A0A` yields approximately 5.7:1 contrast ratio. For body text (16px+) this passes WCAG AA (4.5:1), but for the `--type-micro` size (11px, used for category tags and chip labels), this is uncomfortably close to illegible on actual phone screens, especially in low-light environments where users would be using a dark-mode app. Consider bumping to `#777777` (~6.8:1) for micro text use.

### 8. The spacing system has token bloat for a mobile app

Seven spacing tokens (`xs` through `3xl`) plus four layout constants is reasonable on paper, but the actual components use Tailwind's spacing utilities (`gap-3`, `p-3`, `mt-1.5`, `py-0.5`) far more than design tokens. The spec says "all spacing is a multiple of 4px" but components routinely use 6px (`gap-1.5`), 10px (`py-2.5`), and other non-4px-multiple values.

This isn't enforceable without Tailwind theme configuration that maps the spacing system to the custom tokens. As long as Tailwind's default spacing scale is available, developers will use `mt-2.5` instead of the token system.

---

## What's Missing

### 1. No dark-mode implementation path exists

The design system describes a dark-mode app. The `globals.css` has a `@media (prefers-color-scheme: dark)` block that only changes `--background` and `--foreground` — the two generic Tailwind-level tokens. None of the Lark surface, text, border, or accent tokens are defined. No component references them.

There needs to be an explicit migration plan:
1. Define all Lark tokens in `:root`
2. Remove all old tokens
3. Update Tailwind's `@theme inline` to expose Lark tokens
4. Find-and-replace all old token references in components
5. Replace all `bg-white`, `bg-gray-*`, `text-gray-*` hardcoded Tailwind classes

This is a large, mechanical, high-risk refactor. It will break every component visually. It should be done as a single, focused sprint — not incrementally.

### 2. No empty state designs

The app will have empty states everywhere: no events matching filters, no plans yet, no friends added, no notifications. The design system says nothing about these. Empty states are brand moments — they establish tone when there is no content to carry the experience. Linear does this exceptionally well with their ghost illustrations. Letterboxd uses film reel metaphors.

Lark needs empty state specs for:
- Discovery feed (no results)
- Plans strip (no plans)
- Friends list (no friends)
- Notifications (none yet)
- Search results (nothing found)

### 3. No loading state specs

The `PlansStrip.tsx` loading skeleton uses `bg-gray-200` and `bg-gray-100` for shimmer placeholders — hardcoded Tailwind grays that will look wrong on a dark background. Every component needs skeleton/loading states defined in terms of the token system.

Skeletons on dark UIs need particular care. A `--bg-surface` block pulsing to `--bg-hover` and back creates a subtle, high-quality loading feel. Apple Music's dark-mode skeletons are a good reference.

### 4. No focus/keyboard/accessibility specs

The design system specifies hover/press states but has zero mention of:
- Focus ring styling (the `Button.tsx` component uses `focus:ring-2` with old tokens)
- Focus-visible vs. focus (keyboard vs. pointer)
- Skip navigation links
- ARIA patterns for the filter chip system
- Color contrast testing against WCAG AA (the monochrome palette needs explicit verification)

This is a compliance risk. The dark-mode, monochrome design amplifies accessibility concerns because there is less color contrast differentiation between interactive and non-interactive elements.

### 5. No scroll position indicator for horizontal scroll containers

The Plan cards horizontal scroll and filter chips horizontal scroll have no affordance telling users there is more content off-screen. The spec says "fixed width 200px, shows partial next card to invite scroll" — but on smaller screens or when there is only one plan, this peek pattern breaks.

A scroll indicator (dot pagination, gradient fade on edges, or a subtle end-shadow) needs to be specified.

### 6. No toast visual spec for dark mode

The current Toast renders as `--bg-elevated` with `--border-subtle`, which is correct per the design system. But the success/error/info semantic types in `useToast()` likely render differently — and those visual distinctions need to stay monochrome. The spec says nothing about how toast types differ visually.

### 7. No pattern for inline image fallbacks at detail page scale

The `EventHero.tsx` no-image fallback is a gradient from `--surface-inset` to `--border-default` with the category name displayed as text. The design system says: "show `--bg-surface` with a centered Lark mark in `--border-subtle`." At the hero image scale (16:9, full-width), a flat grey rectangle with a tiny Lark mark will look cheap. This needs a more considered treatment — perhaps a subtle noise texture, a pattern, or a photographic-quality placeholder.

### 8. No spec for the Spotify green icon integration

The Spotify icon in `EventCard.tsx` is a bright green circle on a white card. It will be a bright green circle on a dark card in the Lark system. This is one of the few places where external brand color will live inside the UI chrome. It needs explicit handling: size, opacity treatment, hover state, whether it gets a muted treatment or retains full brand color. The current implementation uses `externalBrands.spotify.bg` (`#1DB954`) directly — this is correct but needs the design system to explicitly acknowledge it.

### 9. No responsive breakpoint tokens

The design system defines mobile-first layout constants (`--screen-padding: 20px`) but has no responsive breakpoints. The codebase uses Tailwind's default breakpoints (`sm`, `md`, `lg`). The design system should either adopt these explicitly or define its own.

---

## Provocations

### 1. Kill Geist Sans for headlines. Ship Space Grotesk or something with actual character.

The design system spec already knows this: "Not a geometric sans-serif. Something with slight irregularity." Geist Sans is the anti-thesis of this vision. It is clean, corporate, and invisible — which is fine for body copy but fatal for a nightlife app's identity.

**Proposal:** Use Space Grotesk (free, Google Fonts, fast loading) for `--type-display` and `--type-title`. Keep Geist Sans for body and metadata. The slightly wider letterforms and quirky 'a' and 'g' in Space Grotesk give it the editorial confidence the spec is reaching for. Load only weights 600 and 700 to keep the font payload under 20KB.

Alternatively: Instrument Sans has a more organic curve to its terminals. Either would be a massive upgrade over the current typographic uniformity.

### 2. The hero image deserves a gradient that earns its keep

Currently `EventHero.tsx` applies a `bg-gradient-to-t from-black/70 via-black/30 to-transparent` over the hero image. The design system says "Never apply color filters, overlays, or tints to event art." This gradient overlay is arguably a tint. But without it, the title text overlaid on the image becomes illegible against bright artwork.

**Proposal:** Instead of overlaying the image, push the title BELOW the hero image entirely. Let the image be full-bleed and untouched. Below it, the title lives on the dark canvas where it is always legible. This is what Letterboxd does with movie posters — the image is sacred, the metadata is below.

If the title-on-image treatment is kept, the gradient needs to be part of the design system spec (acknowledged, not ignored). Pretending the overlay doesn't exist while it ships in production is intellectual dishonesty.

### 3. Introduce a single accent color that is NOT white — and make it the Lark signature

Here is the hard truth: near-white as an accent on a dark background is clean, but it is also generic. Linear, Vercel, Raycast, every developer tool uses white-on-dark. It is the safe choice. It will never be recognizable.

**Provocation:** What if Lark had ONE signature color — not as a UI chrome element, but as a single, iconic detail? A warm amber (`#F5A623`) for the Lark wordmark only. Or a desaturated cyan (`#6ECFCF`) for notification badges. Nothing else. Just one touch that makes the app recognizable in a screenshot.

DICE uses electric blue as its single accent. Letterboxd uses green. Linear uses purple. Every one of these apps is "dark mode monochrome" — but they each have a signature hue that makes them identifiable at a glance. Near-white is the absence of a decision.

This is the most controversial provocation and may be wrong. But it is worth a serious conversation.

### 4. Event card images deserve more drama

The current event card uses a 72px square thumbnail (`w-16 h-16 sm:w-20 sm:h-20`). This is adequate but uninspired. Event imagery is supposedly "the only color in the app" — the one thing the monochrome UI exists to frame. But 72px is not framing. It is relegating.

**Proposal:** Consider two card layouts:
- **Standard card:** Current list layout, but with a larger image (96px or aspect-ratio thumbnail)
- **Featured card:** Full-width image card for events with high-quality imagery, friend activity, or presale urgency. Image spans the full card width at 3:2 or 16:9, text below.

Spotify mixes card sizes to create visual rhythm in their discovery feed. A uniform list of identical 72px thumbnails becomes a wall of sameness after 10 items. Visual hierarchy through card variation would make the feed feel more like a curated editorial selection and less like a database dump.

### 5. The "Start Plan" button should feel like starting something

The design system says Start Plan should be "intentionally understated" — outlined, not filled. I disagree. Starting a plan is THE core action of the entire app. The product vision says "every surface should make it obvious how to turn 'I want to do something' into an actual plan." Understated and obvious are in direct tension.

**Proposal:** Start Plan gets the filled accent treatment. It is the ONE primary CTA that earns the filled button. "Invite Friends" on the event page is a secondary action. "Share" is a ghost. But "Start Plan" is the app's reason for existing. Make it unapologetically prominent.

### 6. Texture. The design system mentions "hand-textured" but delivers machine-flat.

The philosophy section says: "High-contrast. Monochrome. Hand-textured. Raw but refined." The word "hand-textured" appears once and is never followed up with any implementation guidance.

**Proposal:** Introduce a single texture element — a subtle paper grain or film grain noise overlay at 2-4% opacity on `--bg-primary`. This is the Letterboxd technique. It transforms a flat `#0A0A0A` background from "default dark mode" into something with tactile quality. It is the difference between a black iPhone screen and a black piece of card stock. The flyer-on-a-telephone-pole test from the philosophy section demands this.

Implementation: a 200x200px tiled noise PNG at `opacity: 0.03` as a fixed background. Near-zero performance cost. Massive perceived quality improvement.

### 7. Build a "night mode" that activates contextually

The app is about going out at night. What if the UI actually responded to time of day?

- **Day (before 5pm):** Slightly elevated surface values. `--bg-primary: #0F0F0F` instead of `#0A0A0A`. Event discovery feels like browsing.
- **Night (after 5pm):** Full dark. Maximum contrast. The app feels like it is already in the venue.
- **Day-of mode (event day):** Even more dramatic — the event's hero image color could subtly bleed into the status bar or header as a 3-5% color wash.

This is borrowing from Spotify's album color extraction and Apple Music's ambient color matching. It would make Lark feel alive in a way no competitor does. It is also complex to implement well. But it is the kind of detail that makes people screenshot an app and share it.

---

## Priority Recommendations

1. **Do the token migration.** Nothing else matters until `globals.css` defines the Lark tokens and components reference them. Every other improvement is blocked by this.

2. **Rewrite Chip.tsx and Button.tsx** to enforce the two-tier system (primary filled, secondary outlined). Remove `signal`, `engage`, `success`, `warning`, `category`, `accent` color variants.

3. **Kill the colored category tags** in `categoryColors.ts`. Replace with monochrome `text-[var(--text-secondary)]` for all categories. This is the single most visible violation of the design system.

4. **Migrate avatar.ts** from colorful gradients to monochrome treatment.

5. **Add a display typeface.** Even if the choice is temporary, switching headlines to Space Grotesk would immediately differentiate the visual identity.

6. **Design empty states.** These are the first thing new users will see. They need to establish the brand, not show a grey void.

7. **Spec the noise texture.** A 30-minute task that transforms the perceived quality of the dark canvas.

8. **Acknowledge the hero image gradient** in the design system spec. Either adopt it formally or redesign the EventHero layout to avoid the contradiction.

---

*This audit is a snapshot. It should be revisited after the token migration is complete to assess whether the implemented system matches the spec.*
