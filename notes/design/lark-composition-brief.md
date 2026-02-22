# Lark Composition Brief

## The Problem This Solves

The design system defines what each component looks like. It doesn't define how a *page* should feel when you're scrolling through twenty components stacked on a dark canvas.

Monochrome removes the easiest tool designers have for creating visual variety: color. Without colored section headers, category badges, or status indicators breaking up the feed, a dark-mode app risks becoming a monotonous vertical scroll of identically-weighted cards. Every card is `#141414` on `#0A0A0A`. Every title is `#F5F5F5`. Every piece of metadata is `#A0A0A0`. The tokens are correct — the page is boring.

This brief defines the composition principles that replace color as the tool for visual rhythm, hierarchy, and relief. These sit between the design system (what things look like) and the motion language (how things move). This is: how things are *arranged*.

---

## Typography Decision: Space Grotesk

**The pick:** Space Grotesk for display and headlines. System font stack for body and metadata.

**Why Space Grotesk:**

It does the two things a dark-mode app typeface needs to do simultaneously. At large sizes (28px hero, 22px event title), the slightly quirky letterforms — look at the lowercase "a" and "g," the way the "k" has an angular joint — give it personality without trying hard. It feels like it belongs on a poster. At small sizes (14px caption, 11px micro label), it's perfectly legible on dark backgrounds because the stroke weight is even enough that letterforms don't thin out and disappear in light-on-dark rendering, the way some geometric sans-serifs do.

It's on Google Fonts, so zero licensing cost and clean loading via `next/font/google`. It has the right range of weights (300–700) to support the full type scale.

It's not Söhne (too expensive for this stage). It's not Inter or DM Sans (too safe, too ubiquitous — every SaaS dashboard uses them). It's not a display-only face that falls apart at caption sizes. It sits in the narrow space between "has character" and "doesn't demand attention."

**The Lark wordmark in Space Grotesk:** Four letters, one syllable. At weight 700, "Lark" in Space Grotesk has a natural angularity in the "k" that could be subtly extended into a mark — a slightly lengthened tail or upward kick. The wordmark doesn't need a separate icon or symbol. The letterforms are the identity. Think Linear: their logo is just their name, precisely set, with one geometric accent. That restraint works for Lark. The word is strong enough to stand alone.

**System font for body/metadata:** The discovery feed is information-dense. Venue names, dates, times, friend counts — this text needs to load instantly and read clearly at small sizes. The system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) renders at native speed, matches platform expectations, and keeps the payload light. Space Grotesk earns its network cost by showing up where it matters — headlines, titles, the wordmark, the search placeholder. It doesn't need to carry metadata.

---

## Composition Principles

### 1. Weight Contrast Replaces Color Contrast

Without colored badges and tinted backgrounds, the primary hierarchy tool is typographic weight.

An event title at `--text-primary` (#F5F5F5) and weight 600 next to a venue/time line at `--text-secondary` (#A0A0A0) and weight 400 creates a contrast ratio difference that's actually *larger* on a dark background than colored text creates on a light one. The brightness jump from A0 to F5 is dramatic in a dark room. On a white background, the equivalent jump (dark gray to black) is subtle. Dark mode makes weight differences louder.

This means the type scale isn't just an organizational tool — it's the visual relief system. Everywhere color used to do work (green for Going, amber for Interested, red for Sports, blue for links), weight and brightness do that work now. Heavier, brighter = primary. Lighter, dimmer = secondary. The hierarchy is a single axis, not a color map.

**Practical implication:** Resist the temptation to add visual interest by introducing colored accents "just for this one element." Every color you add diminishes the power of the monochrome system. The discipline creates the distinction.

### 2. Section Gaps as Visual Punctuation

On a dark canvas, vertical spacing does the work that divider lines and colored section backgrounds do on light UIs.

The specific rhythm: **48px (`--space-3xl`) before a new section header, 12px (`--space-md`) between cards within a section.** That 4:1 ratio creates unmistakable breathing room between "TODAY" and "THIS WEEK" without needing a line, a background change, or a colored header. The gap *is* the divider.

Section headers themselves (YOUR PLANS, TODAY, THIS WEEK) are 11px uppercase `--text-secondary` — whisper-quiet labels. They don't need to shout because the space around them does the announcing. A big gap, then a small quiet label, then cards begin. That rhythm repeats down the entire feed and becomes a reliable visual cadence.

**Practical implication:** If a section boundary doesn't feel distinct enough, increase the gap before reaching for a divider line or background color. Space is the first tool, not the last resort.

### 3. The Search Bar as Visual Anchor

The search bar sits at the top of the discovery feed. In the old light-mode design, it was just an input field — gray on white, functional, forgettable.

On a dark canvas, the search bar at `--bg-surface` (#1E1E1E) with its placeholder text becomes the brightest non-image element at the top of the screen. It's doing double duty: functional input AND the visual landmark that orients you on the page.

Make it generous — 48px height instead of the standard 40px. Set the placeholder text ("What kind of night are we having?") in Space Grotesk at body weight, not in the system font. This is the one piece of metadata text that earns the display typeface because it's not metadata — it's an invitation. It should feel like a conversation starter sitting at the top of the page, not a form field waiting for input.

The search bar's brightness relative to the dark canvas creates a natural focal point. Users' eyes land there first, then drift down into the feed. This is a composition choice, not a component choice — it's about what the *page* draws attention to.

### 4. Grid-Breaking for Rhythm

If every event card is the same height with the same 72x72 thumbnail, the feed becomes a metronome — steady, predictable, and eventually numbing. On a light UI, colored category tags and status badges broke this monotony. On a monochrome dark canvas, size does that work.

The pattern: **one featured card with a full-width or large-format event image at the top of each day section, then standard compact thumbnail cards below.** The featured card lets the event art breathe — a Mt. Joy poster at full width on a dark canvas is a visual event in itself. The compact cards below are information-dense rows. Then the next section opens with another featured card.

This creates a visual rhythm: big image, compact rows, big image, compact rows. The feed *breathes*. The alternation between expansive imagery and dense information gives the eye places to rest and places to scan quickly.

**Practical implication:** This requires a "featured" or "hero" card variant in the component system, and logic for which event gets hero treatment per section (first event, promoted event, event with best image, etc.). It's not just a visual decision — it touches data and layout logic.

### 5. The Plans Strip as Horizontal Texture

The horizontal scroll of plan cards ("YOUR PLANS") at the top of the feed is already good architecture for surfacing active plans. On a dark canvas, it has a second function: it creates a horizontal band of `--bg-elevated` cards across the top of the page that breaks the vertical rhythm.

This matters because vertical scroll feeds are inherently monotonous — everything flows in one direction. That horizontal strip of plan cards introduces a perpendicular visual line. Your eye tracks differently across it than it does scanning down event cards. It's a texture change.

Show a partial card at the right edge of the strip to signal horizontal scrollability. The peek of a truncated card title is more compelling than a scroll indicator dot.

### 6. The Controlled Explosion

`--status-need-ticket` (#FF4444) is the only chromatic color in the entire UI. This scarcity is a feature, not a limitation.

In a UI full of colored badges, red is just another color in the system — it competes with green, amber, blue, and purple for attention. In Lark's monochrome UI, red is like a single red light in a dark room. When someone in a plan marks "Need Ticket" and that `#FF4444` appears, it has *enormous* visual weight. It's unmissable. It immediately communicates urgency because nothing else in the interface looks like it.

This principle extends to future design decisions: if you ever need to add another semantic color (a new alert state, a new urgency indicator), consider very carefully whether the monochrome system can handle it first. Each new color dilutes the power of every existing color. The fewer colors in the system, the more each one means.

**Practical implication:** Any request to add a new colored element to the UI should be treated as a significant design decision, not a casual choice. Escalate to the design-director agent.

### 7. Dark Space as Luxury

On light backgrounds, empty space feels *empty* — vacant, unfinished, like something is missing. This is why light-mode apps tend to pack content tightly and fill white space with subtle textures, background colors, or decorative elements.

On dark backgrounds, empty space feels *confident*. It feels like a deliberate choice, like a gallery with well-spaced paintings on dark walls. The darkness absorbs the space gracefully.

This means Lark can afford generous padding that a light-mode app couldn't. Generous space around the wordmark in the nav bar (don't crowd it). Generous card padding (16px feels right; don't go below it). Generous gaps between sections (the 48px section gap isn't wasted space — it's a design choice that reads as quality).

The general rule: when in doubt, add more space, not more content. The dark canvas earns its keep by making restraint look expensive.

---

## How This Relates to Existing Docs

| This Brief Covers | Design System Covers | Motion System Covers |
|---|---|---|
| How components are **arranged** on a page | How each component **looks** (tokens, specs) | How components **move** (timing, easing) |
| Page-level rhythm and visual relief | Individual component styling | Entrance choreography and stagger |
| Typography as a hierarchy *system* | Type scale values and weights | Text reveal animation |
| When to break the grid | Card dimensions and padding | Card transition specs |
| Spacing philosophy | Spacing token values | Stagger intervals between cards |

This is the missing middle layer. The design system gives you bricks. The motion system tells you how bricks arrive. This brief tells you how to build a wall that's interesting to look at.

---

*Status: **Implemented.** All 7 principles are live in the codebase as of Feb 2026. Weight contrast, section gaps (48px/12px), generous search bar (48px height, Space Grotesk placeholder), plans strip horizontal texture, `#FF4444` controlled explosion, dark space luxury, and film grain noise texture. The composition brief is now reference documentation, not a proposal.*

*See `notes/design/ui-reference.md` for the full design system token reference.*
