# Austin Events Calendar – Implementation Plan v2

## Status: Phases 0–4 Complete

The MVP foundation is built:
- ✅ Data model (Venue, Event, User, UserEvent)
- ✅ Authentication (Supabase magic link)
- ✅ Social layer (Going/Interested with comments)
- ✅ Ingestion pipeline (Moody Center, Paramount Theatre scrapers)
- ✅ 183 real events in database

## Remaining Work: Refinement Phases

The following phases focus on polish, deployment, and data quality before tackling automation.

---

## Phase 5: Production Deployment

### What
Get the app live on a public URL so it can be shared and tested on mobile devices.

### Why
- Currently only accessible via `localhost:3000`
- Need to test on real devices
- Want to share with friends for feedback
- Vercel deployment is free and aligns with original scope

### Deliverables
- App deployed to Vercel with public `.vercel.app` URL
- Environment variables configured in Vercel dashboard
- Database accessible from production
- App works on mobile browsers

### Estimated Time
15–30 minutes

---

## Phase 6: Authentication Improvements

### What
Replace or supplement magic link auth with Google OAuth for smoother sign-in.

### Why
- Magic link sends a "welcome email" every login (confusing UX)
- Google OAuth is one-click, no email required
- Better for casual users and demo purposes
- Supabase has built-in support

### Deliverables
- Google OAuth enabled in Supabase
- "Sign in with Google" button on login page
- Existing magic link option retained (optional)
- User records sync correctly for OAuth users

### Estimated Time
20–30 minutes

---

## Phase 7: UI Filters & Polish

### What
Add filtering capabilities to the home page for better event discovery.

### Why
- 183 events is too many to scroll through
- Users want to filter by venue, date, or interest
- "Friends Going" filter shows social proof
- Mobile-friendly filters improve usability

### Deliverables
1. **Venue filter** — Dropdown to filter by venue
2. **Date range filter** — Pick start/end dates
3. **"Friends Going" toggle** — Show only events with Going/Interested
4. **Category filter** — Filter by CONCERT, COMEDY, etc. (optional)
5. **Mobile-responsive filter UI**

### Estimated Time
1–2 hours

---

## Phase 8: Data Quality & Scraper Improvements

**📋 Detailed Specification**: See `notes/phase8-data-extraction-scope.md` for comprehensive HTML structure analysis, code examples, and implementation guidance.

### What
Audit existing scrapers to extract richer metadata and improve data quality.

### Why
- Missing context: opponent names for sports, event subtypes
- Paramount events could have genre/category from page
- Better descriptions improve user experience
- Some events may have pricing or venue details we're not capturing

### Deliverables
1. **Moody Center improvements**:
   - **Use JSON-LD structured data** (discovered in audit) for exact times and end dates
   - Extract opponent names for basketball/sports events from descriptions
   - Capture event subcategory if available
   - Use full-resolution image URLs from JSON-LD

2. **Paramount improvements**:
   - Extract genre/category from `data-tn-product-type-id` attribute
   - Distinguish Paramount Theatre vs Stateside Theatre (investigation needed)
   - Better image URL handling

3. **General improvements**:
   - Add `notes` field or expand `description` for additional context
   - Improve category inference logic
   - Handle edge cases (postponed, cancelled, sold out)

### Estimated Time
1–2 hours

---

## Phase 9: Automated Ingestion & Additional Venues

### What
Set up scheduled ingestion and add more Austin venues.

### Why
- Events should update automatically (daily)
- More venues = more comprehensive calendar
- This was original Phase 5, postponed for refinements

### Deliverables
1. **Automated ingestion**:
   - Vercel Cron job OR external scheduler (cron-job.org)
   - Daily runs at 3 AM Austin time
   - Error logging and monitoring

2. **Additional venues** (pick 2–3):
   - ACL Live at The Moody Theater
   - Stubb's BBQ
   - Emo's Austin
   - Bass Concert Hall
   - Long Center

3. **Monitoring** (optional):
   - Admin page showing ingestion status
   - Manual trigger button

### Estimated Time
3–4 hours

---

## Phase 10: Future Enhancements (Post-MVP)

These are out of scope for MVP but noted for future consideration:

- Search functionality (search by event title/artist)
- Push notifications for saved events
- Calendar export (iCal, Google Calendar)
- Social features (see who else is going)
- Ticketmaster/SeatGeek API integration
- Artist/performer database
- Price tracking and alerts

---

## Recommended Order

1. **Phase 5: Deploy** — Get it live first (15 min)
2. **Phase 6: Google OAuth** — Better auth UX (20 min)
3. **Phase 7: UI Filters** — Make it usable (1–2 hrs)
4. **Phase 8: Data Quality** — Richer data (1–2 hrs)
5. **Phase 9: Automation** — Set and forget (3–4 hrs)

**Total remaining: ~6–9 hours**

---

## Quick Reference: Current File Structure

```
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/logout/
│   │   │   ├── events/[id]/attendance/
│   │   │   └── ingest/
│   │   ├── auth/
│   │   ├── events/[id]/
│   │   ├── login/
│   │   └── profile/
│   ├── components/
│   │   ├── AttendanceButton.tsx
│   │   ├── EventCard.tsx
│   │   ├── Header.tsx
│   │   └── UserMenu.tsx
│   ├── db/
│   │   ├── events.ts
│   │   ├── prisma.ts
│   │   ├── userEvents.ts
│   │   ├── users.ts
│   │   └── venues.ts
│   ├── ingestion/
│   │   ├── orchestrator.ts
│   │   ├── upsert.ts
│   │   ├── types.ts
│   │   ├── sources/
│   │   │   ├── moodyCenter.ts
│   │   │   ├── paramount.ts
│   │   │   └── mock.ts
│   │   └── utils/
│   │       └── dateParser.ts
│   └── lib/
│       ├── auth.ts
│       ├── utils.ts
│       └── supabase/
├── scripts/
│   └── ingest-offline.ts
└── docs/
    ├── scope.md
    ├── implementation-plan.md
    ├── implementation-plan-v2.md (this file)
    └── llm-tasks.md
```

