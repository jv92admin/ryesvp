# LLM Execution Task List v2

This document contains granular, step-by-step tasks for Phases 5–9.
Each task includes exact commands, file paths, and verification steps.

**Prerequisite**: Phases 0–4 are complete. The app runs locally with 183 real events.

---

## Phase 5: Production Deployment

### Task 5.1: Push Code to GitHub

**Action**: Initialize git and push to GitHub repository

```bash
git add .
git commit -m "Complete Phase 4: Ingestion pipeline with Moody Center and Paramount scrapers"
git push origin main
```

**Verify**: Code appears in GitHub repository

---

### Task 5.2: Create Vercel Project

**User action required**:
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import GitHub repository
4. Framework preset: Next.js (auto-detected)
5. Click "Deploy" (will fail initially - need env vars)

---

### Task 5.3: Configure Environment Variables in Vercel

**User action required**: In Vercel project settings → Environment Variables, add:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

**Note**: Copy exact values from `.env.local`

---

### Task 5.4: Redeploy After Environment Variables

**User action required**:
1. In Vercel dashboard, go to Deployments
2. Click "..." on latest deployment → "Redeploy"
3. Wait for deployment to complete

**Verify**: 
- Deployment succeeds (green checkmark)
- Visit `https://[project-name].vercel.app`
- Home page loads with events
- Can navigate to event detail pages

---

### Task 5.5: Update Supabase Redirect URLs

**User action required**: In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add to Redirect URLs: `https://[project-name].vercel.app/auth/callback`

**Verify**: Magic link login works on production URL

---

### ✅ Phase 5 Checkpoint

- [ ] App deployed to Vercel
- [ ] Public URL accessible (e.g., `https://ryesvp.vercel.app`)
- [ ] Events display correctly
- [ ] Auth works on production
- [ ] App works on mobile browser

---

## Phase 6: Authentication Improvements (Google OAuth)

### Task 6.1: Enable Google OAuth in Supabase

**User action required**:
1. Go to https://console.cloud.google.com
2. Create new project (or use existing)
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://[SUPABASE_PROJECT].supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

6. In Supabase Dashboard → Authentication → Providers:
   - Enable Google
   - Paste Client ID and Client Secret
   - Save

---

### Task 6.2: Update Login Page with Google OAuth Button

**Action**: Update file `src/app/login/page.tsx`

**Replace the entire file with**:
```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Check your email for the magic link!');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Austin Events
          </Link>
          <p className="text-gray-600 mt-2">Sign in to track events</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Magic Link Form */}
          {status === 'success' ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              
              {status === 'error' && (
                <p className="mt-2 text-sm text-red-600">{message}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full mt-4 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'loading' ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/" className="hover:underline">
            ← Back to events
          </Link>
        </p>
      </div>
    </main>
  );
}
```

---

### Task 6.3: Verify Build

**Action**: Run terminal command
```bash
npm run build
```

**Expected output**: Build completes successfully

---

### Task 6.4: Test Google OAuth

**Action**: Run `npm run dev` and test

**Verify**:
- [ ] Login page shows "Continue with Google" button
- [ ] Click button → redirects to Google sign-in
- [ ] After Google sign-in → redirects back to app, logged in
- [ ] User record created in database (check Prisma Studio)
- [ ] Profile page works for OAuth users

---

### ✅ Phase 6 Checkpoint

- [ ] Google OAuth button on login page
- [ ] Google sign-in flow works
- [ ] User records sync for OAuth users
- [ ] Magic link still works as fallback
- [ ] `npm run build` succeeds

---

## Phase 7: UI Filters & Polish

### Task 7.1: Create Filter Components

**Action**: Create file `src/components/EventFilters.tsx`

**Content**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface EventFiltersProps {
  venues: Venue[];
  showFriendsFilter?: boolean;
}

export function EventFilters({ venues, showFriendsFilter = false }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [venueId, setVenueId] = useState(searchParams.get('venueId') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [friendsGoing, setFriendsGoing] = useState(searchParams.get('friendsGoing') === 'true');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (venueId) params.set('venueId', venueId);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (friendsGoing) params.set('friendsGoing', 'true');
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearFilters = () => {
    setVenueId('');
    setStartDate('');
    setEndDate('');
    setFriendsGoing(false);
    router.push('/');
  };

  const hasFilters = venueId || startDate || endDate || friendsGoing;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Venue Filter */}
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
            Venue
          </label>
          <select
            id="venue"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All venues</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Friends Going Toggle */}
        {showFriendsFilter && (
          <div className="flex items-center gap-2">
            <input
              id="friendsGoing"
              type="checkbox"
              checked={friendsGoing}
              onChange={(e) => setFriendsGoing(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="friendsGoing" className="text-sm font-medium text-gray-700">
              Friends going
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 7.2: Create Venues Data Fetcher

**Action**: Update file `src/db/venues.ts`

**Add this function at the end** (or rename existing `getVenues` to `getAllVenues`):
```typescript
export async function getAllVenues(): Promise<Venue[]> {
  return prisma.venue.findMany({
    orderBy: { name: 'asc' },
  });
}
```

**Note**: You can either add this new function or rename the existing `getVenues()` function to `getAllVenues()` - both work the same way.

---

### Task 7.3: Update Events Query for Filters

**Action**: Update file `src/db/events.ts`

**Add to GetEventsParams interface** (around line 6):
```typescript
export interface GetEventsParams {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  venueId?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
  friendsGoing?: boolean; // NEW
}
```

**Update getEvents function** to handle friendsGoing filter:

Find this section and replace:
```typescript
export async function getEvents(params: GetEventsParams = {}): Promise<EventWithVenue[]> {
  const {
    startDate,
    endDate,
    category,
    venueId,
    status = 'SCHEDULED',
    limit = 50,
    offset = 0,
  } = params;
```

Replace with:
```typescript
export async function getEvents(params: GetEventsParams = {}): Promise<EventWithVenue[]> {
  const {
    startDate,
    endDate,
    category,
    venueId,
    status = 'SCHEDULED',
    limit = 1000,
    offset = 0,
    friendsGoing = false,
  } = params;
```

---

### Task 7.4: Add Function to Get Events with Attendance

**Action**: Add to `src/db/events.ts` at the end:

```typescript
export async function getEventsWithAttendance(params: GetEventsParams = {}): Promise<EventWithVenue[]> {
  const events = await getEvents(params);
  
  if (!params.friendsGoing) {
    return events;
  }
  
  // Filter to only events that have at least one UserEvent with GOING or INTERESTED status
  const eventsWithAttendance = await prisma.event.findMany({
    where: {
      id: { in: events.map(e => e.id) },
      userEvents: { 
        some: { 
          status: { in: ['GOING', 'INTERESTED'] }
        } 
      },
    },
    include: { venue: true },
    orderBy: { startDateTime: 'asc' },
  });
  
  return eventsWithAttendance;
}
```

---

### Task 7.5: Update Home Page with Filters

**Action**: Replace content of `src/app/page.tsx`

**Content**:
```typescript
import { getEvents, getEventsWithAttendance, groupEventsByDate } from '@/db/events';
import { getAllVenues } from '@/db/venues';
import { EventCard } from '@/components/EventCard';
import { EventFilters } from '@/components/EventFilters';
import { Header } from '@/components/Header';
import { formatDateHeading } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{
    venueId?: string;
    startDate?: string;
    endDate?: string;
    friendsGoing?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const venues = await getAllVenues();
  
  const events = await getEventsWithAttendance({
    venueId: params.venueId || undefined,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate + 'T23:59:59') : undefined,
    friendsGoing: params.friendsGoing === 'true',
    limit: 1000,
  });
  
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Austin Events
            </h1>
            <p className="text-gray-600 mt-2">
              Concerts, comedy, and more happening in Austin, TX
            </p>
          </header>

          <EventFilters 
            venues={venues} 
            showFriendsFilter={!!user}
          />

          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((dateKey) => (
                <section key={dateKey}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2">
                    {formatDateHeading(dateKey)}
                  </h2>
                  <div className="space-y-3">
                    {groupedEvents.get(dateKey)!.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          
          <p className="text-center text-sm text-gray-500 mt-8">
            Showing {events.length} events
          </p>
        </div>
      </main>
    </>
  );
}
```

---

### Task 7.6: Verify Build

**Action**: Run terminal command
```bash
npm run build
```

**Expected output**: Build completes successfully

---

### Task 7.7: Test Filters

**Action**: Run `npm run dev` and test

**Verify**:
- [ ] Filters appear on home page
- [ ] Venue dropdown shows all venues
- [ ] Selecting venue filters events
- [ ] Date range filters work
- [ ] "Friends going" toggle appears when logged in
- [ ] "Clear" button resets filters
- [ ] Event count updates

---

### ✅ Phase 7 Checkpoint

- [ ] Venue filter works
- [ ] Date range filter works
- [ ] "Friends going" filter works (when logged in)
- [ ] Filters are mobile-friendly
- [ ] `npm run build` succeeds

---

## Phase 8: Data Quality & Scraper Improvements

### Task 8.1: Audit Moody Center Scraper

**Action**: Review `src/ingestion/sources/moodyCenter.ts`

**Current issues to fix**:
1. Time always defaults to 8 PM
2. No opponent extraction for basketball games
3. Category inference could be better

---

### Task 8.2: Improve Moody Center Date/Time Parsing

**Action**: Update `src/ingestion/utils/dateParser.ts`

**Find and update parseMoodyCenterDate function**:
```typescript
/**
 * Parse date string like "Sunday / Feb 1 / 2026" with optional time
 * Returns a Date object
 */
export function parseMoodyCenterDate(dateStr: string, timeStr?: string): Date | null {
  try {
    // Format: "Sunday / Feb 1 / 2026"
    const parts = dateStr.split('/').map(p => p.trim());
    if (parts.length !== 3) return null;

    const [, monthDay, year] = parts;
    const monthDayParts = monthDay.split(' ');
    if (monthDayParts.length !== 2) return null;

    const monthAbbr = monthDayParts[0];
    const day = parseInt(monthDayParts[1], 10);
    const yearNum = parseInt(year, 10);

    const monthMap: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3,
      'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7,
      'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
    };

    const month = monthMap[monthAbbr];
    if (month === undefined || isNaN(day) || isNaN(yearNum)) return null;

    // Parse time if provided (e.g., "7:00 PM", "8:00pm")
    let hours = 20; // Default to 8 PM
    let minutes = 0;
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3]?.toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }

    return new Date(yearNum, month, day, hours, minutes, 0, 0);
  } catch (error) {
    console.error('Error parsing Moody Center date:', dateStr, error);
    return null;
  }
}
```

---

### Task 8.3: Improve Category Inference

**Action**: Update `src/ingestion/utils/dateParser.ts`

**Replace inferCategory function**:
```typescript
/**
 * Extract category from event title or description
 */
export function inferCategory(title: string, description?: string | null): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Sports - check first (more specific patterns)
  if (text.includes('basketball') || text.includes('vs.') || text.includes('vs ') || 
      text.includes('longhorns') || text.includes('spurs') || text.includes('game day')) {
    return 'SPORTS';
  }
  
  // Comedy
  if (text.includes('comedy') || text.includes('stand-up') || text.includes('standup') ||
      text.includes('comedian') || text.includes('laugh')) {
    return 'COMEDY';
  }
  
  // Theater
  if (text.includes('theater') || text.includes('theatre') || text.includes('play') || 
      text.includes('musical') || text.includes('broadway') || text.includes('ballet') ||
      text.includes('opera') || text.includes('dance')) {
    return 'THEATER';
  }
  
  // Festival
  if (text.includes('festival') || text.includes('fest ')) {
    return 'FESTIVAL';
  }
  
  // Film
  if (text.includes('film') || text.includes('movie') || text.includes('screening') ||
      text.includes('cinema')) {
    return 'OTHER'; // Could add FILM category later
  }
  
  // Default to Concert for music-related or unknown
  if (text.includes('concert') || text.includes('tour') || text.includes('live') ||
      text.includes('band') || text.includes('music') || text.includes('singer')) {
    return 'CONCERT';
  }
  
  return 'OTHER';
}
```

---

### Task 8.4: Add Notes Field to Schema (Optional)

**Action**: If you want to store additional metadata, add to `prisma/schema.prisma`:

Find the Event model and add after `description`:
```prisma
notes         String?     // Additional scraped context
```

Then run:
```bash
npx prisma migrate dev --name add-notes-field
```

---

### Task 8.5: Update Paramount Scraper for Genre

**Action**: Update `src/ingestion/sources/paramount.ts`

Find where events are pushed (around line 105-120) and update to extract genre from the container:

After this line:
```typescript
const category = inferCategory(title, null) as EventCategory;
```

Add:
```typescript
// Try to get more specific category from page context
// Look for genre indicators in parent containers
const parentText = $prod.text().toLowerCase();
let refinedCategory = category;
if (parentText.includes('comedy') || parentText.includes('stand-up')) {
  refinedCategory = 'COMEDY' as EventCategory;
} else if (parentText.includes('film') || parentText.includes('movie') || parentText.includes('screening')) {
  refinedCategory = 'OTHER' as EventCategory; // Film
} else if (parentText.includes('music') || parentText.includes('concert')) {
  refinedCategory = 'CONCERT' as EventCategory;
}
```

Then use `refinedCategory` instead of `category` in the events.push call.

---

### Task 8.6: Re-run Ingestion

**Action**: Run terminal command
```bash
npm run ingest:all
```

**Verify**: Events should have better categories

---

### ✅ Phase 8 Checkpoint

- [ ] Date/time parsing improved
- [ ] Category inference is more accurate
- [ ] Scrapers extract richer data
- [ ] `npm run ingest:all` works
- [ ] `npm run build` succeeds

---

## Phase 9: Automated Ingestion (Deferred)

This phase sets up automatic daily ingestion. Tasks include:

### Task 9.1: Create Vercel Cron Configuration

**Action**: Create file `vercel.json` in project root

**Content**:
```json
{
  "crons": [
    {
      "path": "/api/ingest/all",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Note**: `0 9 * * *` = 9 AM UTC = 3 AM Austin time. Requires Vercel Pro plan.

---

### Task 9.2: Alternative - Use External Cron Service

**User action required** (if not on Vercel Pro):
1. Go to https://cron-job.org (free)
2. Create account
3. Create new cron job:
   - URL: `https://[your-app].vercel.app/api/ingest/all`
   - Method: POST
   - Schedule: Daily at 3 AM
4. Save and activate

---

### Task 9.3: Add Authentication to Ingest Endpoint

**Action**: Update `src/app/api/ingest/all/route.ts`

Add authentication check at the start of the POST function:
```typescript
// Check for cron secret (set in Vercel env vars)
const authHeader = request.headers.get('authorization');
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

### Task 9.4: Set CRON_SECRET in Vercel

**User action required**:
1. Generate a random secret: `openssl rand -hex 32`
2. Add to Vercel environment variables: `CRON_SECRET=[generated-secret]`
3. If using cron-job.org, add header: `Authorization: Bearer [secret]`

---

### ✅ Phase 9 Checkpoint

- [ ] Cron job configured (Vercel or external)
- [ ] Ingestion runs daily at 3 AM
- [ ] Endpoint protected with secret
- [ ] Events update automatically

---

## Quick Reference: All New Files

Phase 5–9 creates or modifies:
- `src/app/login/page.tsx` (updated for Google OAuth)
- `src/components/EventFilters.tsx` (new)
- `src/app/page.tsx` (updated for filters)
- `src/db/events.ts` (updated for friendsGoing)
- `src/db/venues.ts` (added getAllVenues)
- `src/ingestion/utils/dateParser.ts` (improved)
- `src/ingestion/sources/paramount.ts` (improved)
- `vercel.json` (new, for cron)

