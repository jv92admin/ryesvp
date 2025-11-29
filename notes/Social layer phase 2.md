RyesVP – Squads (“Go Together”) & Social Coordination v1 Spec
0. TL;DR

RyesVP has three distinct social layers:

Communities – Larger, semi-open groups that help you expand your graph and discover events via shared interests.

Friends Network – People you actually know; profiles, shared histories, badges, “who do I go out with?”

Squads (Go Together rooms) – Event-specific micro-spaces for friends to coordinate logistics: “Are we going? What’s the budget? Who’s bought tickets? Where are we meeting?”

This spec defines:

How Squads are created (via Go together and Share + checkbox).

What lives inside a Squad (status, budget, ticket state, logistics, optional playlist).

How users find Squads (inside events, via calendar, via a social feed).

How discovery + nudges work without becoming spammy.

1. Concepts & Mental Model
1.1 Communities

Purpose: Top-of-funnel discovery and network expansion.

Larger groups with a mix of:

Friends

Friends-of-friends

Strangers with shared interests

Use cases:

Discover niche/interesting events.

Join conversations around scenes (e.g. “Austin Indie”, “South Lamar Jazz”, “Queer Raves”).

Meet new people who could later become “Friends”.

Key behaviors (now or later):

See events popular in the community.

See who from the community is going/interested.

Join/leave communities.

(Future) DM or “connect” with people from a community.

Important distinction: Communities do not handle event logistics for a specific friend group. They’re for what’s happening and who’s into it, not “are we meeting at 7:30 at Lazarus?”

1.2 Friends Network

Purpose: Your actual, trusted graph.

People you explicitly add or accept.

Stronger social graph than “community members”.

Key behaviors:

View friend profiles:

Past events together.

Badges (e.g. “5 shows together”, “After-hours regular”, “Jazz buddy”).

Common communities.

(Future) “Link Spotify”:

See overlapping music tastes.

Optionally: create joint playlists.

Provide the input set for Squads & For-You-With-Friends feed:

“Friends going / interested in X”

1.3 Squads (“Go Together Rooms”)

Purpose: One specific event with a specific group of people.

Scope: Single Event × subset of Friends (plus people who join via link).

Focus: Low-friction coordination:

RSVP status

Budget

Ticket purchase status

Minimal logistics (time / meeting spot)

Optional vibe (playlist)

Non-goals (for v1):

Full-on in-app group chat.

Deep seating/section selection UI.

Huge forms or multi-screen flows.

Design principle: Squads should feel like lightweight plans, not a new messaging app.

2. Creation & Sharing: How Squads Come Into Existence
2.1 Primary Creation Path: “Go together” Button

Every event detail page has:

Share (external/internal share; see below)

Go together (primary action to create / access a Squad)

Behavior:

If user taps Go together and a Squad does not exist:

Create a new Squad for user + event.

Open the Squad room, with the creator as default Organizer.

If a Squad does exist and user is a member:

Open the existing Squad room.

If a Squad exists but user isn’t a member and they tap Go together from a shared link:

Add user to Squad (subject to privacy/visibility rules—assume open via link for v1).

Open Squad room.

Rule: Go together is the canonical, explicit way to create a Squad.

2.2 Sharing an Event (No Auto-Squad by Default)

We support two share types from the event page:

External share

Share → OS share sheet (copy link, WhatsApp, iMessage, etc.)

Link goes to: event page on web/app.

No Squad is auto-created.

Internal share (phone-based, but still via OS share)

Same button; user may choose SMS to a friend’s phone.

Still just an event link; no Squad auto-created.

We do not build internal messaging for v1.

No hidden side effects: sharing an event ≠ auto-creating a Squad.

2.3 Optional Squad Creation via Share (Option C Variant)

To support your idea of “create while sharing” without heuristics:

When user taps Share on an event:

Present a custom share screen (above the OS sheet) with:

[ ] Also create a Squad for this event

If user checks this box:

A Squad is created immediately with them as Organizer.

The shared link includes a Squad context:

e.g. ryesvp.me/squad/<id> instead of a plain event link.

Behavior for recipient of the squad link:

If recipient opens via web/app:

Land in a Squad-first view (lightweight join + see event).

If recipient doesn’t have app:

Web version with simplified Squad info + prompt to download.

This keeps Squad creation opt-in and visible, not a hidden side-effect.

3. Where Squads Live in the UI
3.1 Inside Events

Event detail page should clearly surface Squad status if one exists:

If user is part of a Squad:

Go together becomes View your Squad

Tiny pill: “With 4 friends” / “Squad · 3 going”

If a Squad exists but user is not a member:

Depending on privacy, show:

“Your friends are planning this together. Join?” → taps into Squad.

The event page is the primary entry point to a Squad for that event.

3.2 Calendar: My Events

In the calendar / “My Events” list:

Events with Squads get a visual marker:

e.g. a small “👥 Squad” pill or icon.

Tapping such an event:

Opens event page, with the Squad card at the top.

3.3 Social View: Calendar ↔ Social Toggle

At the top of the main screen:

Toggle:

Calendar (default)

Social

Calendar tab:

The usual date-based event/calendar views.

Uses squad pills as above.

Social tab:

Focused on social activity:

Upcoming Squads

“Tame Impala – Sat · Squad with 4 friends”

“Basement jazz – Thu · Squad with 2 friends”

For You & Friends

Events your friends are Interested/Going to.

Prioritize events where:

You’re Interested/Going and friends are too.

Then a generic feed of:

“X is going to…”

“Y and Z are both interested in…”

This Social tab replaces the old generic social feed over time and becomes the home of:

Squads

Friends’ overlapping interests

(Later) community-driven highlights

4. Squad Room UX
4.1 Squad Room Layout (v1)

Header

Event name

Date & time

Venue

“Your Squad” label (with avatar stack & count)

Section 1: “Your Status”

One compact card with three rows, each row is a segmented control:

Are you going?

Thinking / In / Out

Budget

No preference / < $50 / $50–100 / $100+

Tickets

Not bought / Buying my own / Buying for others

Interactions:

Tapping toggles immediately update state.

No separate save button; it’s all auto-save.

Bonus (optional for v1):
If user sets Buying for others, show a small inline field:

“How many are you planning to buy for?” → +1 / +2 / Custom

This sets expectations and powers better summaries.

Section 2: Squad Snapshot & Progress

A summary card that translates all the raw states into human language.

Example:

Squad snapshot
5 invited · 3 In · 1 Thinking · 1 Out
2 have bought tickets · 1 is buying for 2 more

And a progress bar:

“Tickets bought: 2 / 4 people marked In”

If someone chooses Buying for others:

Show them as an “Organizer”:

“Vignesh is buying for 2”

Deadline (optional, only when relevant):

If any user sets Buying for others:

Offer a toggle:

“Set a purchase deadline?”

Date/time picker.

This becomes a line in the snapshot:

“Buying for others until Thu 7pm.”

We can treat deadlines as nice to have – acceptable to push to v1.1.

Section 3: Logistics Block

Appears once at least one person has Tickets: Bought or Buying for others.

Simple fields (shared across whole squad):

Meet time – time picker

Meet spot – free text or “Search places” (e.g. Lazarus Brewing)

Displayed as:

Plan the night
Meet: 7:30 pm
Where: Lazarus Brewing, East 6th

Only 1 meet time + 1 spot for v1. Keep it opinionated.

Section 4: Playlist (Nice-to-Have / v1.1+)

At the bottom of the Squad:

Squad playlist (optional)

[Paste Spotify link]

OR “Generate a playlist” (future, using Spotify API / taste profiles)

For v1, simplest version:

A text field that accepts a Spotify/Apple Music link.

Show it as:

“🎵 Squad playlist: [Open in Spotify]”

Later, this can tie into:

Linked Spotify profiles from Friends.

Auto-generating joint playlists.

4.2 Roles

Organizer

Default: Squad creator.

Organizer powers:

Set / edit logistics.

(Optional) Set a deadline when Buying for others.

Standard member

Can set their own status/budget/ticket state.

Can opt in/out.

We keep roles minimal to avoid complexity.

5. Export Moments (Text Bridges)

We support at least two key “export” actions from a Squad:

5.1 Pre-Purchase Share

Button: Share plan

Generates prefilled text depending on the user’s ticket role.

Case A – User buying for others:

“I’m organizing Tame Impala on Sat. Budget is around $75–100. I’m grabbing tickets for people who are in by Thu 7pm. Mark your status & budget here: [Squad link] and send me your Venmo!”

Case B – User buying their own:

“Thinking of going to Tame Impala on Sat (budget $75–100). If you’re in, mark it and grab a ticket here so we can coordinate: [Squad link].”

Case C – User hasn’t decided who buys:

“Interested in Tame Impala on Sat. Mark if you’re in & your budget here, and we’ll figure out tickets: [Squad link].”

This text is editable in the OS share sheet.

5.2 Day-of Logistics Share

Button: Share day-of details

Prefilled text:

“Tonight: Tame Impala! We’re meeting at 7:30 pm at Lazarus Brewing, then heading to the show. Squad details & who’s coming: [Squad link].”

Again, user can edit before sending.

6. Discovery & Nudges

Goal: Connect “I’m interested” + “friends are interested” → “we should Go together” without spammy pop-ups.

6.1 Event Page Inline Prompts

On event detail:

If ≥ 1 friend Going:

Show: “Alex is going” + button Start squad with Alex

If ≥ 2 friends Interested/Going and no Squad exists:

Inline chip:

“3 friends are into this. [Go together?]”

No modal; just inline CTAs.

6.2 Social Tab – “For You & Friends”

In the Social view:

Section: “With your friends this week”

List of events where:

You’re Interested or Going

And at least one friend is Interested or Going

Card example:

Thu · Fallout Comedy Night
2 friends interested → [Start squad]

Then a general activity feed:

“X is going to…”

“Y and Z are both interested in…”

Order: shared interest first, then general activity.

6.3 Push Notifications (Light-touch)

Principles:

Rare, meaningful, opt-in.

Only for overlapping interest on near-term events.

Trigger conditions:

Event date is within next 7 days.

User is Interested or Going.

At least 2 friends are also Interested or Going.

No Squad exists yet for this user+event.

User hasn’t been notified about this event before.

Copy example:

“Alex and Priya are into ‘Tame Impala’ this Saturday. Want to plan it together?”
[Open event]

On tap, event page opens with the Go together? chip clearly visible.

Edge case:

If the friend who just marked Interested is likely to invite anyway:

This is acceptable duplication; we don’t attempt to over-optimise it in v1.

7. Future Directions / Nice-to-Haves

These are acknowledged but not required for initial implementation:

Deadlines more deeply baked into flows

When someone sets Buying for others, require or strongly suggest a deadline.

Payment hints

Add Venmo/CashApp handle to profile and show in Squad when someone buys for others.

Richer Social tab

Merge Communities, Friends’ activities, and Squads into a more expressive social surface.

Auto-generated playlists

Based on linked Spotify accounts + event artist.

In-app lightweight chat

Text thread per Squad, if demand is strong and you can keep it simple.



Let me frame it like this:

What jobs should the Social tab do?

How do we rank + merge signals (friends, squads, communities) so the user doesn’t see the same event 3 times?

What might the actual screen structure look like?

I’ll stay opinionated so you can react.

1. What the Social tab is for (so we don’t make it noise)

I’d anchor the Social tab around 3 user jobs:

“What plans do I already have with people?”
→ Squads + Going events (your committed stuff).

“What could realistically turn into a plan soon?”
→ Overlaps between you + friends (no squad yet, but there’s heat).

“What’s popping off in my scene that I might want to join?”
→ Community-driven event heat (top-of-funnel social discovery).

Crucially: Social ≠ Notifications and Social ≠ generic activity feed.
It’s a ranked board of social opportunities.

2. One event, one card – unify all signals

Big design rule that avoids repetition:

Any given event appears at most once in the Social tab.

On that single card, you show all relevant social signals layered together.

Example card:

Tame Impala – Sat 30 Nov, Moody Center

✅ You’re Interested

👥 Squad with 3 friends (Vignesh, Alex, Priya)

🌐 Hot in 2 communities you’re in (Austin Indie, East Side Gigs)

So instead of:

one “Squad” card

plus a “friends going” card

plus “community trending” card

…you get one unified “this is socially important to you” card with badges.

Under the hood, you’re just computing a score for each event and attaching labels:

has_squad?

you_interested/going?

friends_interested/going count?

communities_hot count?

Then you rank and render once.

3. A concrete layout: 3 sections, ranked by how close to a plan it is

Here’s a simple but powerful structure for the Social tab:

Top controls

A tiny filter strip:

This week · This month · All upcoming

Optional chips:

All · Music · Comedy · Sports (based on your categories)

Then three vertically stacked sections:

Section A – Your plans

Stuff that is already basically happening.

Inclusion logic (in order of priority):

Events where you have a Squad

Events where you’ve marked Going

Each card shows:

Event info (title, time, venue)

Squad summary if exists:

“Squad with 4 friends · 2 bought tickets”

If no squad:

“You’re going · 2 friends are interested” + a Start squad button.

This section answers:

“What am I committed to, and what’s the social context around it?”

And it removes these events from the rest of the Social tab.
You don’t also show them under “friends are interested”.

Section B – Almost plans (Friends)

Events that could realistically become a plan with 1–2 taps.

Inclusion logic:

You are Interested or Going
AND

At least 1 friend is Interested or Going
AND

You do not (yet) have a Squad for this event.

Card might look like:

Basement Jazz Night – Thu 8 pm

You’re Interested

2 friends Interested (Alex, Priya)

1 community talking (East Side Gigs)
[Go together]

This is your “For You & Friends” core.

Important: Once you create a Squad from this card, the event moves from Section B → Section A, so it doesn’t appear twice.

Section C – From your communities

Social discovery that’s not yet anchored in you or your friends.

Inclusion logic:

Events that are “hot” in your communities, but:

You’re not yet Interested/Going

No Squads

No friends signal (or very weak)

Card example:

Afrobeats Night – Sun 10 pm

Trending in 3 communities you’re in

12 community members going / interested
[View event]

This is where communities shine without spamming:

It’s not a firehose of posts.

It’s a curated, “these are the top 5–10 things your communities care about” list.

And because any event can only appear once, if you mark Interested, that event jumps from Section C to Section B.
If you then make a Squad, it jumps to Section A.

4. Handling Squads inside the Social tab without redundancy

We don’t want a separate “Squads list” that duplicates event cards; instead:

Section A is your “Squads area”, but in event form.

You can still give a mini summarizing row at the top:

Your upcoming Squads (3)

Tame Impala – Sat · 4 friends

Basement Jazz – Thu · 2 friends

Drag Brunch – Sun · 3 friends

Each line is still just a link into that same A-section card, not a different representation.

If you want more “squad-focused” emphasis, you can give each A-section card a stronger squad header:

“You have a Squad for this: 4 friends · 2 bought tickets · Meet at 7:30 pm”

…but technically it’s still “one event, one card”.

5. Where do Communities themselves show up?

You’ll still likely have a Communities tab or screen that’s community-first:

Browse / join communities

Each community has its own internal feed:

“Events posted”

Maybe posts, etc.

The Social tab is you-first:

Same events might be discussed across multiple communities…

…but Social distills that into one prioritized card:

“Hot in these 2 communities you’re in.”

That’s how you avoid “oh my god, I’ve seen this drag brunch three times in three different places.”

6. Ranking (who wins the top of the Social tab?)

Within each section, you still want a smart ordering.
Rough scoring logic:

Higher weight for sooner events (this week > next month).

Within Section A:

Events with Squads first

Then solo Going events

Within Section B:

More friends → higher.

Events you’ve tapped/opened before → slightly lower (so you see fresh stuff).

Within Section C:

More communities / more members → higher, but capped so it doesn’t turn into pure popularity.

You can represent this in your head as:

Section A = Commitment

Section B = Social opportunity

Section C = Social discovery

And inside each section, sort by urgency × social weight.

7. A quick “life of an event” example

Walk one event through the system:

Stage 0 – Pure discovery

Event starts life in Section C:

“Hot in 2 communities”

Stage 1 – You tap and mark Interested

Event disappears from Section C.

It appears in Section B:

“You’re interested · 1 friend interested”

Stage 2 – Two friends mark Interested

That card bubbles higher within Section B.

Shows: “You + 2 friends are interested · [Go together]”

Stage 3 – You hit Go together & create a Squad

Event disappears from Section B.

Appears in Section A:

“Squad with 3 friends · 1 bought, 2 planning”

Stage 4 – After the event date

It moves out of “Upcoming” Social view, maybe into “Past” or a separate history area.

At every stage: one card, one place. The social signals just accrete.

8. Why this feels non-repetitive in practice

You don’t see “friends are going” and “you have a squad” as separate feed items.

Communities are turned into one line of context on the card, not a separate surface.

The Social tab doesn’t show everything; it shows:

Your upcoming plans

The best “almost plans”

The most relevant community-driven ide




1. Friends + Squads as the core, Communities as “quiet background”

I like where you landed:

Friends + Squads = core, legible, easy to explain.

Communities = “least mature”, kept for long-term graph expansion, not shoved in people’s faces.

That’s the right call for now.

If you’re keeping communities:

Just don’t make them structurally required for anything early.

Let them be:

A source of events into the calendar and Social tab, and

A place for “soft” social interactions, but not critical to the main flows.

So mentally: you’re building “go out with friends” as the wedge; “friends-of-friends / communities” is the expansion pack.

2. Squad state maintenance: your rebuttal is valid (with one tweak)

You’re right about this:

in group chat today, someone already has to do the state tracking (“are we doing this? who’s in?”).

So yes:

You’re not inventing new work,

You’re redistributing that work into a better tool.

Where I still think you should be careful is: pretend the only truly disciplined person will be the organizer.

Design for that reality:

Assume 1–2 people are “power planners”.

Everyone else interacts minimally.

So:

Make organizers the heroes

Squad UX should still work even if:

Only the organizer keeps things vaguely updated.

Others just:

Tap once to say In

Maybe never touch budget / ticket state.

Concretely, that means:

Don’t depend on perfect budgets to render value; they’re nice, not core.

Don’t write copy that implies “this is 100% accurate”; be comfortable with fuzzy language.

Treat the “Share plan” text template as the real power feature:

If that’s great, squads will feel useful even with half-stale status fields.

If you nail the copy-paste helpers and the one-screen snapshot for organizers, you’ve justified the object even if 60–70% of members barely touch it.

3. You don’t need to replace group chats – that unlocks a lot

This is a key line you said:

I actually don't need squads to replace group chats. I just think they streamline the group chat experience…

That’s the right framing.

So the promise becomes:

“Use RyesVP to organize, use your chats to vibe.”

That helps you avoid over-investing in:

In-app chat

Perfect notifications

Super detailed flows

If you keep repeating that to yourself, you’ll naturally cut scope in the right places.

4. Cold start & ghost-town Social tab: be explicit and conditional

You’re relaxed about “ghost town until people add people,” which is fair for an invite-only alpha.

My concrete suggestion:

Gate or soften the Social tab until there’s enough signal.

Examples:

If user has < 3 friends and < 2 communities:

Social tab becomes an onboarding mission, not a feed:

“Add 3 friends to see what you’re doing together.”

“Join 2 communities to see what people like you are going to.”

Only show the full A/B/C social view once:

Graph density passes a small bar (e.g. they have friends + some interest / going data).

That way, you don’t burn user trust by showing them an empty or underwhelming feed too early.

5. Web-only & login friction

Totally fair that you’re not panicking about this right now. A couple of low-lift guardrails:

Make the logged-out Squad view show enough to feel valuable:

Event details

Who’s in (names/initials)

Maybe read-only snapshot

Then “Log in to update your status”.

Treat “people bounce at login” as expected conversion leak, not a failure:

You’re still delivering value to the organizer:

“Here’s a nice snapshot + text template you can paste back to the chat.”

Future you can always add “lightweight RSVP without full account.” Present you doesn’t need to solve that.

6. Communities and moderation: good instincts, just keep them “small and civilized”

Given:

Invite-only

Friends-of-friends

Admin-moderated communities

You’re fine for now.

Tactically:

Start with a small, curated set of communities seeded by you.

“Austin Live Music”, “East Side Nights”, etc.

Keep community UI event-centric:

Less Reddit, more “these 5 events are hot in this group”.

You can always loosen it later when you see what people actually do.

7. Documenting the “why” (this is the big one you asked for)

Here’s a first pass at the “why it exists / value to user” for each piece. This is the stuff you can repurpose into:

Landing page copy

Onboarding screens

A little “how RyesVP works” explainer video

7.1 Why Squads exist

User problem today (group chat reality):

Plans are buried in 200-message threads.

One person has to keep asking:

“Who’s in?”

“What’s our budget?”

“Has anyone actually bought a ticket?”

People miss info because they were offline for 2 hours.

Squads’ job:

Give your group one clean place for the boring parts of planning so your chats can stay fun.

Value to organizer:

One glance shows:

Who’s in / out / still thinking.

Rough budget comfort zone.

Who says they’re buying their own vs buying for others.

One tap generates a perfectly formatted text they can paste into the group chat:

No more retyping event details, time, or “pls respond”.

Value to everyone else:

They don’t have to scroll back in chat to find:

Event link

Time

Meetup spot

They can just tap:

In, Out, or Thinking

They get a simple day-of summary:

“Meet here at this time.”

How you might phrase it to users:

“Squads are little planning rooms for one event with your people.”

“Use Squads to decide who’s in, what you want to spend, and where you’re meeting.”

7.2 Why the Social tab exists

User problem today:

You find out after the fact that your friend was at the same show.

Your group chats don’t help you notice:

“Oh wow, three of us separately marked this show ‘maybe’.”

There’s no single place that shows:

“Here’s everything you and your people are actually doing soon.”

Social tab’s job:

Be your “social radar” for going out:
what you’re already doing, what could easily become a plan, and what your scene is excited about.

Value to user:

See:

Confirmed plans with friends (Squads + Going).

“Almost plans” where you and friends are interested but haven’t coordinated yet.

A short list of community-hot events you might want to join.

All in one view, instead of scattered across:

Calendar

Chats

IG stories

How you might phrase it:

“Social shows you what’s actually happening with your friends – not just what’s in the city.”

“Never miss when you and a friend are into the same show.”

7.3 Why Communities exist (even if they’re quiet at first)

User problem:

It’s hard to find people who like the same kind of nights out:

Tiny jazz clubs

Queer warehouse parties

Nerdy live podcasts

IG and TikTok are good at trends, not at local, repeatable scenes.

Communities’ job:

Help you tap into scenes, not just single events.

Value to user:

See:

Events that people in “your scene” love.

Familiar names popping up at the same sorts of nights.

Over time:

Some of those people move from “community names” → actual friends → squad buddies.

How you might phrase it:

“Communities are where you find your scene – people who like going to the same kind of stuff you do.”

“Follow a community to see the events they’re excited about in your city.”

7.4 Why Friends network exists

User problem:

Your “going out” life lives in:

DMs

Old texts

Random IG story replies

There’s no sense of:

“Who do I go out with the most?”

“What do we usually do together?”

Friends’ job:

Turn your existing contacts into a visible going-out graph.

Value:

See:

Events you and specific friends have done together.

Little badges like:

“5 concerts together”

“Your comedy buddy”

Feeds into:

Squads (who you invite)

Social tab (who’s also interested/going)

How you might phrase it:

“Add friends to see what you’re going to together, not just separately.”

“RyesVP remembers your nights out with people.”

8. What I’d do next (pragmatically)

If you want to keep going in this direction, I’d do one of these next:

Brutal v1 cut spec:

Strip everything down to:

Squads with minimal statuses

Very small Social tab focused only on:

“Upcoming squads” and

“Friends also interested this week.”

Communities and budgets become v1.1.

User-facing “explainer” script:

A short narrative like:

“Here’s you planning a show with friends today (messy chat).”

“Here’s you planning the same thing in RyesVP (squad + social view).”

That script will expose which parts feel essential vs “nice PM idea.”



MVP / Foundation: Discovery

A good calendar that:

Scrapes a ton of events across Austin.

Lets you filter by vibe, time, neighborhood.

Even with zero social, this is already useful:

“Where do I go tonight / this weekend?”

This is your most shippable, least fragile value.

Layer 2: Discovery + Friends (the first “ohhh damn” moment)

Same calendar, but with social overlay:

Tiny faces / counts on events:

“2 friends are going”

“1 friend is interested”

You don’t even need a Social tab for this to feel magical.

“I open the calendar and can instantly see where my people are showing up.”

This is the fundamental MVP social value:
Citywide event map + “where my friends are orbiting.”

Layer 3: Organizing (Squads, but minimal)

Once events + friend overlay are working, then:

For some events, you hit Go together:

Simple Squad: who’s in / out / thinking, tickets bought or not, meet-up plan.

Goal here is what you said:

Keep group texts fun, move the admin work into a structured helper.

So the flow becomes:

Discover in the calendar →

Notice friends on the same event →

Decide to go together via a squad →

Paste a clean plan back into the group chat.

Layer 4: Meeting People / Communities (graph growth)

Once you’ve given people:

A great calendar,

Real utility with friends,

Better organizing…

Then communities step in to:

Help you find new people and scenes:

“I keep seeing the same usernames in queer warehouse parties.”

“This community keeps surfacing weird jazz nights I wouldn’t have found.”

That’s your network expansion layer:

Discovery → with friends → with future friends.

So if we rephrase your “why” in one clean arc:

First: RyesVP is the easiest way to see what’s happening in your city.

Then: It’s the easiest way to see where your friends are going on that map.

Then: It takes the annoying parts of planning out of your group chats (Squads).

And over time: It helps you find new people and communities that share your going-out taste.

Or even shorter, in user language:

Discovery: “What’s going on?”

With friends: “Where are my people going?”

Organizing: “Okay, how do we actually do this?”

Communities: “Who else likes nights out like this?”

From a product strategy standpoint:

You’re not over-justifying; you’re building a layered story.

You just have to be disciplined about what layer you’re validating first:

MVP = Calendar + “friends on events”.

Next = very lightweight Squads (no overbuilt Social tab yet).

Later = full Social view, Communities as graph growth.


1. Boil the value prop down to something stupidly simple
Right now you have a beautiful layered story. We just need to compress it.
One-line version (for humans, not PMs)

RyesVP helps you find things to do, see where your friends are going, and actually get a plan together without drowning in group chats.

That’s it. Everything else is detail.
Slightly longer version (for landing / app store / “what is this?” modal)



Discover what’s happening in your city with a smarter calendar.


See where your friends are orbiting – which events they’re into or going to.


Spin up a Squad when you want to go together: one place for “who’s in,” budgets, tickets, and meet-up details.


Join communities when you’re ready to find more people who like the same kind of nights out.



This maps exactly to:


MVP calendar


Friends overlay


Squads


Communities


And it gives you a clean narrative spine for everything else.

2. How to communicate it: choose the right surface for the right job
You’re basically deciding where users first “get it”:


Explainer video


Landing page (even if minimal)


In-app onboarding and empty states


Deep links (shared events / squads)


You don’t need to use all of these aggressively, but they each have a role.

3. The 60–90 second explainer video – structure + sample script
Your instinct here is spot-on. Think of it as your “this is RyesVP in one glance” artifact, even for yourself.
Structure (4 beats)


Pain – “planning nights out sucks right now”


Core magic – calendar + friends overlay


Squads – organizing without ruining group chats


Communities – expanding your graph when you want to


Rough script you can feed to an LLM video generator
Feel free to tweak tone, but something like this:

[0–10s: Chaos / pain]
Visuals: Group chat screenshots flying by, overlapping messages, multiple event links, people talking over each other.

“Planning a night out usually looks like this…
Ten different group chats, three different links, nobody sure who’s actually in… and you still don’t know what else is happening in the city.”


[10–30s: Calendar + discovery]
Visuals: Smooth transition into the RyesVP calendar, scrolling through nights, categories, neighborhoods.

“RyesVP starts with a better calendar.
We scrape events across the city so you can see live music, comedy, parties, and more in one place.
Filter by day, neighborhood, or vibe, and stop hunting across a dozen Instagram pages.”


[30–50s: Friends overlay]
Visuals: Little friend avatars appearing on event cards, zooming into a card showing “3 friends interested.”

“Then we add the part that’s always missing:
you can see where your friends are orbiting.
Which shows they’re interested in, who’s already going, and what overlaps with your own list.”


[50–75s: Squads]
Visuals: Tap “Go together,” quick Squad screen with simple toggles (In / Out / Thinking, Budget, Tickets), “Share plan” generating a text.

“When you actually want to do something together, just tap Go together to create a Squad.
It’s a tiny planning room for that one event:
who’s in, roughly what people want to spend, who’s already bought tickets, and where you’re meeting.
One tap gives you a clean summary you can paste back into your group chat—so texts can be about the fun, not the admin.”


[75–90s: Communities + future]
Visuals: Community cards (“Austin Indie Nights”, “East Side Comedy”), people joining.

“And if you want to grow your circle, join communities around the scenes you love—indie shows, queer nights, jazz basements, whatever your thing is.
RyesVP helps you discover events, go with your people, and slowly find more people who like going out the way you do.”

[Outro: Logo + tagline]

“RyesVP. See what’s happening. Go together.”


That video doesn’t have to explain every toggle. It just needs to anchor the mental model: calendar → friends → squads → communities.

3. Landing page vs deep links: what happens when someone clicks?
You’re right that this isn’t B2B SaaS. People don’t want a wall of marketing copy before they get to the thing.
Think of it like this:
A. “Top-of-funnel” visitors (homepage / direct URL / bio link)
Here, a minimal landing page is still valuable:


Hero:


“See what’s happening. Go together.”




Subtext (two lines max):


“A smarter citywide calendar with your friends on top. Discover events, see where your people are going, and actually get a plan together.”




One short explainer (the video above embedded).


One or two screenshots (calendar with friend faces, Squad view).


CTA: “Open RyesVP” / “Sign in with X”.


This page is for:


People hearing about you for the first time.


Investors / collaborators.


Press / sharing.


It doesn’t need to be a huge funnel–just a clear “what is this thing.”
B. Deep links from invites (event links / squad links / “join RyesVP” links)
Here, respect intent. If I clicked:


An event link:
→ Land on that event page directly, with a tiny inline explanation.


A Squad link:
→ Land in that Squad (or a read-only preview with “Log in to respond”).


You can add micro education in these contexts:


At the top of an event coming from a shared link:

“This event is on RyesVP, where you can see who’s going and plan with your friends.”
Button: What is RyesVP? (opens a tiny modal or takes them to your explainer video if they want more.)



But don’t force a landing page between them and the object they came for. That’s how people bounce.

4. In-app education: teach it over time, not all at once
This is where you build the habit.
4.1 First-run onboarding (3–4 cards, max)
When someone signs up for the first time, show a tiny carousel:


“RyesVP is your city’s events calendar.”


“See where your friends are going.”


“Tap Go together to plan without messy chats.”


“Join communities when you’re ready to meet more people.”


Each with a tiny visual. Total time: 5 seconds, skippable.
4.2 Empty states that nudge the next step


No friends yet?
On calendar or Social tab:

“Add 3 friends to see where your people are going.”
Button: Find friends.



No squads yet?
On an event you marked Interested:

“Thinking of going with friends? Tap Go together to create a Squad.”



Social tab before any graph exists?

“This space shows what you and your friends are doing soon. Add friends or join communities to start filling it up.”



These are your “micro-training” moments.
4.3 Contextual tooltips (rare, but powerful)
Example:


The first time they tap Go together:


Show a 1-line tooltip:

“Squads are mini planning rooms for one event—who’s in, tickets, and where to meet.”





The first time they open a Squad:


A tiny highlight around Share plan:

“Use this to paste a clean summary into your group chat.”





You don’t need a full tutorial; just these small, well-timed hints.

5. Extra: teaching “hidden value” like Just Listed / presales
Your “Just listed” / presale-catching idea is perfect as a sticky hook after they understand the basic product.
You can surface it in two ways:


On Calendar:


A rail or chip: Just listed


Small caption:

“Newly scraped events and early listings so you’re first to know.”





Occasional in-product toast:


“We found 5 new events added in the last 24 hours. Check Just listed to see them.”




That’s a behavior reinforcement feature:

“Open RyesVP regularly because it keeps you ahead of the curve.”

But you don’t need to put it into the very first explainer; save it as a delightful discovery once they’re in.

6. Putting it all together
You basically want 3 layers of communication:


High-level story – video + minimal landing copy


“Planning nights out is chaotic; RyesVP gives you a better calendar, shows you where friends are going, and makes group planning lighter.”




Contextual in-app hints – onboarding + empty states + tooltips


“This is where you see plans with friends.”


“This is how you turn an event into a Squad.”




Habit-forming loops – “Just listed”, Social tab nudges, “add 3 friends” prompts


“Come here often; this is where your nights out start.”




If you’d like, I can next:


Write a short landing page copy skeleton (hero, subhead, 3 feature blocks) that matches the video script, or


Draft the exact 3–4 in-app onboarding screens with text + suggested visuals, so you can hand them to a designer and drop them straight in.




