# RyesVP Project Roadmap

## Overview

Master tracker for all workstreams. Individual specs contain implementation details.

**Spec Documents:**
- `ui-polish-spec.md` - Visual improvements, event cards, layout, social sidebar
- `social-layer-spec.md` - Friends, lists, communities
- `social-layer-phase5-spec.md` - Invite codes, user discovery
- `data-enrichment-spec.md` - Knowledge Graph, Spotify integration
- `scheduled-jobs-spec.md` - Cron for scraping + enrichment

---

## Current Priority Order

| # | Item | Spec | Est. Time | Status |
|---|------|------|-----------|--------|
| 1 | **LLM-First Enrichment** | `data-enrichment-spec.md` | 2-3 hrs | 🔲 Next |
| 2 | **Artist Caching** | `data-enrichment-spec.md` | 1 hr | 🔲 After LLM |
| 3 | **Scheduled Jobs** | `scheduled-jobs-spec.md` | 2-3 hrs | 🔲 Later |
| 4 | **Ticketmaster/SeatGeek APIs** | `data-enrichment-spec.md` | TBD | 🔲 Explore |

---

## Delete Account Feature ✅ COMPLETE

- [x] Settings page with "Delete Account" section (Danger Zone)
- [x] Confirmation modal ("Type DELETE to confirm")
- [x] API endpoint: `DELETE /api/users/me`
- [x] Cascade delete all user data (UserEvents, Friendships, Lists, Communities, Invites)
- [x] Clear `ListMember.invitedById` references before delete
- [x] Delete Supabase Auth user (if service role key available)
- [x] Logout and redirect to home

**Future enhancements:**
- Data export before deletion (GDPR portability)
- Grace period / soft delete with recovery window

---

## Completed Work

### UI Polish ✅
- [x] Typography & Color (Geist Sans)
- [x] Event Card with Images (images, NEW badge, category badges)
- [x] Layout Improvements (max-w-6xl, 2-column layout)
- [x] Event Detail Polish (hero image, enrichment section)
- [x] Share Button (native share API, clipboard fallback)
- [x] Lazy Loading (50 events per page, "Load More" button)
- [x] Social Sidebar (right column with network, events, friend activity)

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

### Invite Codes ✅
- [x] Invite code generation (one per user)
- [x] Share button includes `?ref=` code
- [x] Invite link card on /friends page
- [x] Invite banner on event pages (logged-out users)
- [x] Invite context on login page ("Alice invited you!")
- [x] Auto-friend on signup via invite
- [x] Simplified login to Google OAuth only

### Delete Account ✅
- [x] Danger Zone section in Profile Settings
- [x] Confirmation modal (type DELETE to confirm)
- [x] `DELETE /api/users/me` endpoint
- [x] Cascade delete all user data
- [x] Supabase Auth deletion (with service role key)

---

## Next Up: LLM-First Enrichment

**Problem:** Current KG-first enrichment struggles with:
- Context blindness ("Couch" band → furniture wiki)
- Generic events ("Gospel Brunch", "Texas WBB")
- Sports/local acts

**Solution:** LLM categorizes first, then targeted API lookups.

See `data-enrichment-spec.md` for full details.

---

## Backlog (Future)

| Item | Spec | Notes |
|------|------|-------|
| Activity Feed | `ui-polish-spec.md` | Real-time friend/community activity in sidebar. Requires activity logging. |
| Invite-Gated Signup | `social-layer-phase5-spec.md` | Email-first flow, require invite for new users. **Deprioritized** - current soft invite approach works well for now. |
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

### Sprint: Invite Codes (Complete ✅)
- Invite codes with auto-friend
- Share button integration
- Login page invite context
- Google OAuth only

### Sprint: UI Polish (Complete ✅)
- Lazy loading (50 per page)
- Social Sidebar with:
  - Your Network (friends + communities)
  - Your Events (upcoming)
  - Friends Going (friend activity)
  - Quick invite link copy
- Two-column responsive layout

### Sprint: Delete Account (Complete ✅)
- [x] DELETE /api/users/me endpoint
- [x] Danger Zone UI + confirmation modal
- [x] Cascade delete + Supabase Auth cleanup

### Sprint: LLM Enrichment (Next)
- [ ] OpenAI/Gemini integration
- [ ] LLM-first categorization
- [ ] Targeted Spotify/KG lookups
- [ ] Artist caching

### Sprint: Infrastructure (Future)
- [ ] Scheduled jobs (cron)
- [ ] Ticketmaster/SeatGeek exploration

---

**Last Updated:** November 28, 2024

