# Austin Events Calendar – Implementation Plan

## Infrastructure Setup Requirements

### Required Accounts & Services

1. **GitHub Account** (free)
   - For version control and Vercel integration
   - Repository will be public or private (your choice)

2. **Vercel Account** (free tier)
   - Sign up at https://vercel.com
   - Free tier includes:
     - Unlimited deployments
     - Serverless functions (10s timeout on free tier, 60s on Pro)
     - Cron jobs (Pro feature, but can use free alternatives initially)

3. **Supabase Account** (free tier)
   - Sign up at https://supabase.com
   - Free tier includes:
     - 500MB database
     - 2GB bandwidth
     - Unlimited API requests
     - Auth (up to 50,000 monthly active users)

4. **Domain** (optional for MVP)
   - Vercel provides free `.vercel.app` subdomain
   - Custom domain can be added later

### Initial Setup Steps

#### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization (or create one)
4. Fill in:
   - **Name**: `austin-events-calendar` (or your preference)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to Austin (e.g., `us-east-1`)
5. Wait ~2 minutes for project to provision
6. Once ready, go to **Settings → API** and note:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - **Keep secret!**
7. Go to **Settings → Database** and copy the connection string:
   - Use "Connection pooling" mode (port 6543) for Prisma
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true`

#### Step 2: Create GitHub Repository
1. Create new repo on GitHub (public or private)
2. Clone locally: `git clone [your-repo-url]`
3. Initialize Next.js project (we'll do this in Phase 0)

#### Step 3: Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Add environment variables (we'll configure these in Phase 0):
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy (will fail initially, that's OK - we'll fix in Phase 0)

---

## Phase 0: Project Bootstrap & Infrastructure

### Deliverables
- ✅ Next.js project initialized with TypeScript
- ✅ Prisma configured and connected to Supabase
- ✅ Supabase Auth client configured
- ✅ Tailwind CSS set up
- ✅ Environment variables configured (local + Vercel)
- ✅ Basic project structure created
- ✅ Vercel deployment working (even if empty)

### Tasks
1. Initialize Next.js project with TypeScript
2. Install dependencies:
   - `prisma`, `@prisma/client`
   - `@supabase/supabase-js`, `@supabase/ssr`
   - `tailwindcss`, `postcss`, `autoprefixer`
   - `date-fns` (for date handling)
3. Configure Prisma:
   - Initialize Prisma schema
   - Set `DATABASE_URL` in `.env.local`
   - Test connection to Supabase
4. Configure Supabase:
   - Create Supabase client utilities (`src/lib/supabase`)
   - Set up server/client helpers
5. Configure Tailwind CSS
6. Set up project structure:
   ```
   /app
     /api
     /events
     /profile
   /src
     /db
     /ingestion
     /lib
   /prisma
   ```
7. Create `.env.local.example` template
8. Deploy to Vercel and verify environment variables

### Test Plan
- [ ] `npm run dev` starts without errors
- [ ] Can connect to Supabase DB via Prisma Studio: `npx prisma studio`
- [ ] Vercel deployment succeeds (shows Next.js default page)
- [ ] Environment variables are accessible in Vercel dashboard
- [ ] No TypeScript errors: `npm run build`

### Success Criteria
- Project builds and deploys to Vercel successfully
- Database connection works from local and Vercel
- All environment variables properly configured

---

## Phase 1: Data Model & Core Infrastructure

### Deliverables
- ✅ Complete Prisma schema for all entities
- ✅ Database migrations applied to Supabase
- ✅ Seed script with 3-5 test venues
- ✅ Seed script with 10-15 test events
- ✅ Basic API routes (`GET /api/events`, `GET /api/events/[id]`)
- ✅ Home page showing upcoming events list
- ✅ Event detail page (`/events/[id]`)
- ✅ Basic date grouping/filtering

### Tasks
1. **Prisma Schema** (`prisma/schema.prisma`):
   - Define `Venue` model with all fields
   - Define `Event` model with all fields and relations
   - Define `User` model (synced with Supabase Auth)
   - Define `UserEvent` model with composite key
   - Add indexes:
     - `Event`: `venueId`, `startDateTime`, `source + sourceEventId`
     - `UserEvent`: `userId`, `eventId`
   - Add uniqueness constraints

2. **Database Migration**:
   - Create initial migration: `npx prisma migrate dev --name init`
   - Apply to Supabase production DB
   - Verify in Supabase dashboard

3. **Seed Script** (`prisma/seed.ts`):
   - Create 3-5 Austin venues (e.g., Paramount Theatre, Moody Center, ACL Live)
   - Create 10-15 test events across different dates
   - Include variety: concerts, comedy, theater
   - Run: `npx prisma db seed`

4. **Data Access Layer** (`src/db/`):
   - `prisma.ts` - Prisma client singleton
   - `venues.ts` - Venue queries
   - `events.ts` - Event queries (with date filtering)
   - `users.ts` - User sync helpers

5. **API Routes**:
   - `GET /api/events` - List with query params:
     - `?startDate=YYYY-MM-DD` (optional)
     - `?endDate=YYYY-MM-DD` (optional)
     - `?category=CONCERT` (optional)
     - Returns paginated results (limit 50)
   - `GET /api/events/[id]` - Single event with venue details

6. **UI Pages**:
   - `/` - Home page:
     - Shows upcoming events (next 30 days)
     - Grouped by date
     - Links to event detail pages
   - `/events/[id]` - Event detail:
     - Shows full event info
     - Shows venue details
     - Placeholder for "Going/Interested" buttons (non-functional yet)

### Test Plan
- [ ] Prisma Studio shows all tables with correct schema
- [ ] Seed script runs successfully: `npx prisma db seed`
- [ ] `GET /api/events` returns events (test in browser or Postman)
- [ ] `GET /api/events?startDate=2024-01-01` filters correctly
- [ ] `GET /api/events/[id]` returns single event with venue
- [ ] Home page displays events grouped by date
- [ ] Event detail page shows all event information
- [ ] Navigation between pages works
- [ ] No console errors in browser
- [ ] TypeScript compiles: `npm run build`

### Success Criteria
- Database schema matches design spec
- Can query events via API
- UI displays events correctly
- All data persists in Supabase

---

## Phase 2: Authentication & User Profiles

### Deliverables
- ✅ Supabase Auth integrated
- ✅ Login page with email magic link
- ✅ Logout functionality
- ✅ User profile sync (creates User record on first login)
- ✅ Protected routes (redirect to login if not authenticated)
- ✅ User profile page (`/profile`)
- ✅ Shows user's "Going" and "Interested" events (empty initially)

### Tasks
1. **Auth Setup**:
   - Configure Supabase Auth email templates (optional customization)
   - Set up auth callback route: `/auth/callback`
   - Create login page: `/login`
   - Create logout API route: `/api/auth/logout`

2. **User Sync**:
   - Create middleware or server action to sync Supabase Auth user → User table
   - On first login, create User record
   - Update displayName if changed

3. **Auth Helpers** (`src/lib/auth.ts`):
   - `getCurrentUser()` - Get authenticated user
   - `requireAuth()` - Server-side auth check
   - `redirectIfUnauthenticated()` - Client-side redirect

4. **Protected Routes**:
   - Wrap `/profile` with auth check
   - Redirect to `/login` if not authenticated
   - Store redirect URL for post-login navigation

5. **User Profile Page** (`/profile`):
   - Display user email and display name
   - Show "Going" events (empty for now)
   - Show "Interested" events (empty for now)
   - Placeholder for future features

6. **Navigation**:
   - Add "Login" / "Logout" button to header
   - Show user email when logged in

### Test Plan
- [ ] Can click "Login" and see login page
- [ ] Enter email, receive magic link email
- [ ] Click magic link, redirects to app and shows logged in state
- [ ] User record created in database after first login
- [ ] Can access `/profile` when logged in
- [ ] `/profile` redirects to `/login` when not logged in
- [ ] Can click "Logout" and successfully log out
- [ ] After logout, protected routes redirect to login
- [ ] No console errors
- [ ] TypeScript compiles

### Success Criteria
- Users can sign in with email magic link
- User records sync correctly
- Protected routes work as expected
- Profile page accessible when authenticated

---

## Phase 3: Social Layer (Going/Interested)

### Deliverables
- ✅ UserEvent API routes
- ✅ "Going" / "Interested" buttons on event detail page
- ✅ Comment input field for events
- ✅ User profile shows their events with status
- ✅ Can update status (Going → Interested, etc.)
- ✅ Can delete status (remove from list)

### Tasks
1. **UserEvent API Routes**:
   - `POST /api/events/[id]/attendance`:
     - Body: `{ status: "GOING" | "INTERESTED" | "NOT_GOING", comment?: string }`
     - Creates or updates UserEvent record
     - Returns updated UserEvent
   - `DELETE /api/events/[id]/attendance`:
     - Removes UserEvent record
   - `GET /api/events/[id]/attendance`:
     - Returns current user's status for event (if any)

2. **Data Access** (`src/db/userEvents.ts`):
   - `upsertUserEvent()` - Create or update
   - `deleteUserEvent()` - Remove
   - `getUserEvents()` - Get all for a user
   - `getEventAttendance()` - Get count of Going/Interested per event

3. **Event Detail Page Updates**:
   - Add "Going" button (with checkmark icon)
   - Add "Interested" button (with star icon)
   - Add comment textarea (shown when status is set)
   - Show current status if user has one
   - Show count: "X going, Y interested" (from other users)

4. **Profile Page Updates**:
   - Fetch user's UserEvents
   - Display "Going" section with events
   - Display "Interested" section with events
   - Show comments if present
   - Link to event detail pages

5. **UI Components**:
   - `AttendanceButton` component (reusable)
   - Loading states for API calls
   - Success/error toast notifications

### Test Plan
- [ ] Click "Going" on event detail page → status saved
- [ ] Refresh page → status persists and shows correctly
- [ ] Click "Interested" → status updates from "Going"
- [ ] Add comment → comment saves and displays
- [ ] Click same button again → removes status (or toggles)
- [ ] Profile page shows events in correct sections
- [ ] Can click event from profile → navigates to detail page
- [ ] Comment displays on profile page
- [ ] Multiple users can mark same event (test with 2 accounts)
- [ ] Attendance counts update correctly
- [ ] API returns 401 if not authenticated
- [ ] No console errors
- [ ] TypeScript compiles

### Success Criteria
- Users can mark events as Going/Interested
- Comments save and display correctly
- Profile page shows user's events
- Status persists across sessions
- Multiple users can interact with same event

---

## Phase 4: Ingestion Pipeline (MVP)

### Deliverables
- ✅ NormalizedEvent type definition
- ✅ Ingestion framework structure
- ✅ At least 1 working venue scraper
- ✅ Upsert logic with deduplication
- ✅ `/api/ingest/all` endpoint
- ✅ Manual ingestion works (can trigger via API)
- ✅ Events appear in database and UI after ingestion

### Tasks
1. **Type Definitions** (`src/ingestion/types.ts`):
   - `EventSource` enum
   - `NormalizedEvent` interface
   - Validation helpers

2. **Ingestion Framework**:
   - `src/ingestion/upsertEvents.ts`:
     - `upsertEvents(normalizedEvents: NormalizedEvent[])`
     - Implements deduplication logic:
       - Match by `(source, sourceEventId)` if present
       - Else match by `(venueId, startDateTime, normalizedTitle)`
     - Returns stats: `{ created: number, updated: number, errors: number }`
   - `src/ingestion/utils.ts`:
     - `normalizeTitle(title: string)` - lowercase, strip punctuation
     - `findVenueBySlug(slug: string)` - lookup venue

3. **First Venue Scraper** (`src/ingestion/sources/[venue].ts`):
   - Choose one venue (e.g., Paramount Theatre)
   - Implement `fetchEventsFrom[Venue]()`:
     - Fetch HTML (use `fetch` or `cheerio`)
     - Parse event listings
     - Extract: title, date, time, URL, description
     - Map to `NormalizedEvent[]`
     - Handle errors gracefully
   - Return empty array on failure (don't throw)

4. **API Route** (`/api/ingest/all`):
   - `POST /api/ingest/all`:
     - Calls all scraper functions
     - Runs upsert for each batch
     - Returns summary: `{ sources: [...], totalCreated: number, totalUpdated: number }`
     - Handles errors per source (continue if one fails)
   - Add basic authentication (API key or Vercel cron secret)

5. **Testing & Validation**:
   - Test scraper locally: `npm run ingest:test [venue]`
   - Verify events appear in database
   - Verify deduplication works (run twice, should update not create)
   - Test via API: `curl -X POST https://your-app.vercel.app/api/ingest/all`

### Test Plan
- [ ] Scraper function returns `NormalizedEvent[]` with valid data
- [ ] Upsert creates new events in database
- [ ] Running ingestion twice updates existing events (doesn't duplicate)
- [ ] Deduplication matches by `sourceEventId` when available
- [ ] Deduplication matches by `(venue, date, title)` when no `sourceEventId`
- [ ] API endpoint `/api/ingest/all` returns success response
- [ ] Events appear on home page after ingestion
- [ ] Event detail pages show scraped data correctly
- [ ] Errors in one scraper don't break others
- [ ] Invalid data is skipped (logged, not inserted)
- [ ] TypeScript compiles

### Success Criteria
- Can manually trigger ingestion via API
- Events are created/updated in database
- Deduplication prevents duplicates
- UI displays scraped events correctly
- Framework ready for adding more venues

---

## Phase 5: Automated Ingestion & Additional Venues

### Deliverables
- ✅ Vercel Cron job configured (or alternative)
- ✅ Daily automatic ingestion running
- ✅ At least 3-5 venue scrapers implemented
- ✅ Error logging and monitoring
- ✅ Ingestion status page (optional, for debugging)

### Tasks
1. **Vercel Cron Setup**:
   - Option A: Vercel Pro (paid) - Use native cron
     - Add `vercel.json` with cron config:
       ```json
       {
         "crons": [{
           "path": "/api/ingest/all",
           "schedule": "0 3 * * *"
         }]
       }
       ```
   - Option B: Free tier alternative
     - Use external service (e.g., cron-job.org, EasyCron)
     - Or use GitHub Actions scheduled workflow
     - Or manual trigger initially

2. **Additional Venue Scrapers**:
   - Implement 2-4 more venues:
     - Each in separate file: `src/ingestion/sources/[venue].ts`
     - Follow same pattern as first scraper
     - Register in `src/ingestion/index.ts`:
       ```ts
       export const allScrapers = [
         fetchEventsFromParamount,
         fetchEventsFromMoodyCenter,
         // ... etc
       ];
       ```

3. **Error Handling & Logging**:
   - Log ingestion runs to database (optional `IngestionLog` table)
   - Or use console.log (Vercel logs)
   - Track: timestamp, source, eventsCreated, eventsUpdated, errors
   - Send alerts on repeated failures (optional)

4. **Monitoring** (optional):
   - Create `/admin/ingestion` page (protected):
     - Show last ingestion time per source
     - Show success/failure status
     - Manual trigger button
     - Recent logs

5. **Rate Limiting & Best Practices**:
   - Add delays between requests (respectful scraping)
   - Set User-Agent header
   - Handle timeouts gracefully
   - Cache venue lookups

### Test Plan
- [ ] Cron job triggers `/api/ingest/all` (or manual trigger works)
- [ ] All scrapers run successfully
- [ ] Events from multiple venues appear in database
- [ ] No duplicate events across venues (if same event listed)
- [ ] Ingestion completes within Vercel timeout (10s free, 60s Pro)
- [ ] Errors are logged but don't crash ingestion
- [ ] Can manually trigger ingestion via API/admin page
- [ ] Events update daily automatically
- [ ] TypeScript compiles

### Success Criteria
- Ingestion runs automatically daily
- Multiple venues are scraped successfully
- Events stay up-to-date
- System is production-ready

---

## Phase 6: Polish & Production Readiness

### Deliverables
- ✅ Improved UI/UX (better styling, loading states)
- ✅ Date filtering on events page
- ✅ Category filtering
- ✅ Search functionality (optional)
- ✅ Error boundaries and error pages
- ✅ Loading states throughout
- ✅ Mobile-responsive design
- ✅ Performance optimizations

### Tasks
1. **UI Improvements**:
   - Better event cards with images (if available)
   - Improved date grouping display
   - Loading skeletons
   - Empty states ("No events found")
   - Better error messages

2. **Filtering & Search**:
   - Date range picker on `/events` page
   - Category filter dropdown
   - Search by event title (optional)
   - Clear filters button

3. **Performance**:
   - Add pagination to events list
   - Optimize database queries (add indexes if needed)
   - Use Next.js Image component for any images
   - Implement ISR (Incremental Static Regeneration) if applicable

4. **Error Handling**:
   - Error boundaries for React components
   - 404 page for missing events
   - 500 error page
   - Graceful degradation

5. **Mobile Responsiveness**:
   - Test on mobile devices
   - Responsive navigation
   - Touch-friendly buttons

6. **Documentation**:
   - README with setup instructions
   - Environment variables documented
   - How to add new venues documented

### Test Plan
- [ ] All pages work on mobile (test on real device or browser dev tools)
- [ ] Date filtering works correctly
- [ ] Category filtering works correctly
- [ ] Search returns relevant results (if implemented)
- [ ] Loading states show during API calls
- [ ] Error pages display correctly
- [ ] Performance is acceptable (< 2s page load)
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Build succeeds: `npm run build`

### Success Criteria
- App is polished and user-friendly
- All features work as expected
- Performance is good
- Ready for real users

---

## Testing Strategy Summary

### Unit Tests (Optional but Recommended)
- Test data access functions (`src/db/*.ts`)
- Test normalization utilities (`src/ingestion/utils.ts`)
- Test deduplication logic

### Integration Tests
- Test API routes with test database
- Test auth flows
- Test ingestion pipeline

### Manual Testing Checklist (Per Phase)
- [ ] All user flows work end-to-end
- [ ] Database operations succeed
- [ ] API responses are correct
- [ ] UI displays data correctly
- [ ] Errors are handled gracefully
- [ ] Performance is acceptable

### Browser Testing
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)
- Mobile browsers

---

## Environment Variables Reference

### Required for All Phases
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Ingestion (Phase 4+)
INGESTION_SECRET=[random-secret-for-api-auth] # Optional but recommended
```

### Optional
```bash
# External APIs (if used later)
TICKETMASTER_API_KEY=[key]
SEATGEEK_API_KEY=[key]
```

---

## Estimated Timeline

- **Phase 0**: 2-4 hours (setup)
- **Phase 1**: 4-6 hours (data model + basic UI)
- **Phase 2**: 3-4 hours (auth)
- **Phase 3**: 4-5 hours (social layer)
- **Phase 4**: 6-8 hours (first scraper + ingestion)
- **Phase 5**: 4-6 hours (more venues + automation)
- **Phase 6**: 4-6 hours (polish)

**Total**: ~27-39 hours of development time

*Note: Actual time depends on venue website complexity, debugging, and iteration.*

---

## Next Steps

1. **Start with Phase 0**: Set up accounts and initialize project
2. **Work through phases sequentially**: Each phase builds on the previous
3. **Test thoroughly**: Don't skip test plans
4. **Deploy early**: Get Vercel deployment working in Phase 0
5. **Iterate**: Adjust plan as you learn about venue websites

Good luck! 🎉

