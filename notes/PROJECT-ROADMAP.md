# RyesVP Project Roadmap

## Overview

Master tracker for all workstreams. Individual specs contain implementation details.

**Spec Documents:**
- `ui-polish-spec.md` - Visual improvements, event cards, layout
- `social-layer-spec.md` - Friends, lists, communities
- `social-layer-phase5-spec.md` - Invite codes, user discovery
- `data-enrichment-spec.md` - Knowledge Graph, Spotify integration
- `scheduled-jobs-spec.md` - Cron for scraping + enrichment

---

## Current Priority Order

| # | Item | Spec | Est. Time | Status |
|---|------|------|-----------|--------|
| 1 | **Invite Codes** | `social-layer-phase5-spec.md` | Half day | 🔲 Next |
| 2 | **Lazy Loading** | `ui-polish-spec.md` Phase 3 | 1-2 hrs | 🔲 Pending |
| 3 | **Social Engagement Panel** | `ui-polish-spec.md` Phase 8 | 1-2 hrs | 🔲 Pending |
| 4 | **Enrichment Refinement** | `data-enrichment-spec.md` | 1-2 hrs | 🔲 Pending |
| 5 | **Artist Caching** | `data-enrichment-spec.md` | 1 hr | 🔲 Pending |
| 6 | **Scheduled Jobs** | `scheduled-jobs-spec.md` | 2-3 hrs | 🔲 Later |

---

## Completed Work

### UI Polish ✅
- [x] Typography & Color (Geist Sans)
- [x] Event Card with Images (images, NEW badge, category badges)
- [x] Layout Improvements (max-w-5xl)
- [x] Event Detail Polish (hero image, enrichment section)
- [x] Share Button (native share API, clipboard fallback)

### Social Layer ✅
- [x] Friends Foundation (db, api, /friends page)
- [x] Private Lists (integrated into /friends)
- [x] Communities (/communities, reciprocal visibility)
- [x] User Profiles (display name, avatar colors)
- [x] Event Social Signals (friends going, community members)

### Data Enrichment ✅
- [x] Knowledge Graph Integration (bio, image, Wikipedia)
- [x] Spotify Integration (artist links, genres)
- [x] Category Inference (auto-categorize from KG types)
- [x] MOVIE category added
- [x] Event Card Badges (Spotify/Wikipedia icons)
- [x] Backfill existing events (230 processed)

---

## Next Up: Invite Codes

**Why first?** Key growth mechanism. Sharing an event → friend signs up → auto-connected.

**Scope:**
- Share modal with "include friend request" option
- Generate invite codes (e.g., `/events/abc?ref=XYZ`)
- On signup, show pending invites
- Accept → instant friendship

See `social-layer-phase5-spec.md` for full spec.

---

## Backlog (Future)

| Item | Spec | Notes |
|------|------|-------|
| "New to You" Tracking | `ui-polish-spec.md` | Requires `lastVisitAt` on User |
| User Discovery | `social-layer-phase5-spec.md` | Find friends without email |
| "Go Together" | `social-layer-phase5-spec.md` | Coordinate attendance |
| Dark Mode Polish | - | Exists but not styled |
| Search Functionality | - | Not scoped yet |

---

## Sprint Log

### Sprint: Social Layer Foundation (Complete)
- Friends, Lists, Communities
- Profile settings, avatar colors
- Reciprocal visibility

### Sprint: Data Enrichment (Complete)
- Knowledge Graph + Spotify
- Category inference
- Event card badges

### Sprint: Invite Codes + UI Polish (Current)
- [ ] Invite codes
- [ ] Lazy loading
- [ ] Social engagement panel

### Sprint: Infrastructure (Future)
- [ ] Scheduled jobs (cron)
- [ ] Artist caching
- [ ] Enrichment refinement

---

**Last Updated:** November 2024

