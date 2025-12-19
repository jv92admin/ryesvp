# LLM Execution Task List

This document contains granular, step-by-step tasks optimized for LLM execution.
Each task includes exact commands, file paths, and verification steps.

---

## Phase 0: Project Bootstrap

### Prerequisites
User must complete these manually before LLM begins:
- [ ] Create Supabase project and obtain credentials
- [ ] Create GitHub repository
- [ ] Provide environment variables:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

### Task 0.1: Initialize Next.js Project

**Action**: Run terminal command
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Expected output**: Project files created in current directory

**Verify**: Check that these files exist:
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `src/app/page.tsx`
- `src/app/layout.tsx`

---

### Task 0.2: Install Dependencies

**Action**: Run terminal command
```bash
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr date-fns
```

**Verify**: `package.json` contains all listed dependencies

---

### Task 0.3: Initialize Prisma

**Action**: Run terminal command
```bash
npx prisma init
```

**Expected output**: Creates `prisma/schema.prisma` and `.env`

---

### Task 0.4: Create Environment File

**Action**: Create file `.env.local`

**Content**:
```env
# Database (Supabase Postgres with connection pooling)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
```

**Note**: User must replace placeholders with actual values

---

### Task 0.5: Update Prisma Schema Provider

**Action**: Modify file `prisma/schema.prisma`

**Content**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Note**: `directUrl` is optional but recommended for migrations

---

### Task 0.6: Create Project Directory Structure

**Action**: Create directories
```
src/
  lib/
  db/
  ingestion/
    sources/
  components/
```

**Commands**:
```bash
mkdir -p src/lib src/db src/ingestion/sources src/components
```

---

### Task 0.7: Create Prisma Client Singleton

**Action**: Create file `src/db/prisma.ts`

**Content**:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

---

### Task 0.8: Create Supabase Server Client

**Action**: Create file `src/lib/supabase/server.ts`

**Content**:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}
```

---

### Task 0.9: Create Supabase Browser Client

**Action**: Create file `src/lib/supabase/client.ts`

**Content**:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

### Task 0.10: Create Environment Example File

**Action**: Create file `.env.local.example`

**Content**:
```env
# Database (Supabase Postgres with connection pooling)
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:6543/postgres?pgbouncer=true"

# For Prisma migrations (direct connection, not pooled)
DIRECT_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

### Task 0.11: Update .gitignore

**Action**: Append to `.gitignore`

**Content to add**:
```
# Environment files
.env
.env.local
.env*.local

# Prisma
prisma/*.db
prisma/*.db-journal
```

---

### Task 0.12: Verify Database Connection

**Action**: Run terminal command
```bash
npx prisma db pull
```

**Expected output**: Should connect without errors (may show empty schema warning)

**If error**: Check `DATABASE_URL` in `.env.local`

---

### Task 0.13: Verify Dev Server Starts

**Action**: Run terminal command
```bash
npm run dev
```

**Expected output**: Server starts on http://localhost:3000

**Verify**: Open browser to http://localhost:3000, see Next.js default page

---

### ✅ Phase 0 Checkpoint

Before proceeding, verify:
- [ ] `npm run dev` starts without errors
- [ ] `npx prisma db pull` connects to Supabase
- [ ] All files from tasks 0.1-0.11 exist
- [ ] No TypeScript errors: `npm run build`

---

## Phase 1: Data Model & Core UI

### Task 1.1: Define Prisma Schema

**Action**: Replace content of `prisma/schema.prisma`

**Content**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Venue - physical location where events happen
model Venue {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique // e.g., "moody-center", "paramount-theatre"
  websiteUrl String?
  address    String?
  city       String   @default("Austin")
  state      String   @default("TX")
  lat        Float?
  lng        Float?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  events Event[]

  @@index([slug])
}

// Event - a specific show/performance at a venue
model Event {
  id            String      @id @default(uuid())
  venueId       String
  venue         Venue       @relation(fields: [venueId], references: [id])
  title         String
  description   String?
  startDateTime DateTime
  endDateTime   DateTime?
  url           String?     // Link to tickets/info
  imageUrl      String?
  source        EventSource @default(VENUE_WEBSITE)
  sourceEventId String?     // External ID from source (for dedup)
  status        EventStatus @default(SCHEDULED)
  category      EventCategory @default(OTHER)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  userEvents UserEvent[]

  @@unique([source, sourceEventId]) // Dedup by source + external ID
  @@index([venueId])
  @@index([startDateTime])
  @@index([status])
  @@index([category])
}

// User - synced from Supabase Auth
model User {
  id             String   @id @default(uuid())
  authProviderId String   @unique // Supabase Auth user ID
  email          String   @unique
  displayName    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  userEvents UserEvent[]

  @@index([authProviderId])
}

// UserEvent - tracks user's relationship to an event (going/interested)
model UserEvent {
  id        String          @id @default(uuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId   String
  event     Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  status    AttendanceStatus
  comment   String?         // e.g., "Section 105, Row F"
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@unique([userId, eventId]) // One status per user per event
  @@index([userId])
  @@index([eventId])
}

// Enums
enum EventSource {
  VENUE_WEBSITE
  TICKETMASTER
  SEATGEEK
  MANUAL
}

enum EventStatus {
  SCHEDULED
  CANCELLED
  POSTPONED
  SOLD_OUT
}

enum EventCategory {
  CONCERT
  COMEDY
  THEATER
  SPORTS
  FESTIVAL
  OTHER
}

enum AttendanceStatus {
  GOING
  INTERESTED
  NOT_GOING
}
```

---

### Task 1.2: Run Database Migration

**Action**: Run terminal command
```bash
npx prisma migrate dev --name init
```

**Expected output**: Migration created and applied

**Verify**: Run `npx prisma studio` - should show all tables

---

### Task 1.3: Create Seed Script

**Action**: Create file `prisma/seed.ts`

**Content**:
```typescript
import { PrismaClient, EventCategory, EventSource, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { slug: 'moody-center' },
      update: {},
      create: {
        name: 'Moody Center',
        slug: 'moody-center',
        websiteUrl: 'https://moodycenteratx.com',
        address: '2001 Robert Dedman Dr',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'paramount-theatre' },
      update: {},
      create: {
        name: 'Paramount Theatre',
        slug: 'paramount-theatre',
        websiteUrl: 'https://austintheatre.org',
        address: '713 Congress Ave',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'acl-live' },
      update: {},
      create: {
        name: 'ACL Live at The Moody Theater',
        slug: 'acl-live',
        websiteUrl: 'https://acl-live.com',
        address: '310 W Willie Nelson Blvd',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'stubbs' },
      update: {},
      create: {
        name: "Stubb's BBQ",
        slug: 'stubbs',
        websiteUrl: 'https://stubbsaustin.com',
        address: '801 Red River St',
        city: 'Austin',
        state: 'TX',
      },
    }),
    prisma.venue.upsert({
      where: { slug: 'emo-s' },
      update: {},
      create: {
        name: "Emo's Austin",
        slug: 'emo-s',
        websiteUrl: 'https://emosaustin.com',
        address: '2015 E Riverside Dr',
        city: 'Austin',
        state: 'TX',
      },
    }),
  ]);

  console.log(`✅ Created ${venues.length} venues`);

  // Create sample events (dates relative to now)
  const now = new Date();
  const addDays = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(20, 0, 0, 0); // 8 PM
    return date;
  };

  const events = await Promise.all([
    // Moody Center events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-1' } },
      update: {},
      create: {
        venueId: venues[0].id,
        title: 'Taylor Swift - The Eras Tour',
        description: 'Experience the iconic Eras Tour live!',
        startDateTime: addDays(30),
        url: 'https://moodycenteratx.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-1',
        category: EventCategory.CONCERT,
        status: EventStatus.SOLD_OUT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-2' } },
      update: {},
      create: {
        venueId: venues[0].id,
        title: 'Austin Spurs vs. Rio Grande Valley Vipers',
        description: 'NBA G League basketball action',
        startDateTime: addDays(5),
        url: 'https://moodycenteratx.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-2',
        category: EventCategory.SPORTS,
      },
    }),
    // Paramount events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-3' } },
      update: {},
      create: {
        venueId: venues[1].id,
        title: 'John Mulaney - Live Comedy',
        description: 'Stand-up comedy from the Emmy-winning comedian',
        startDateTime: addDays(14),
        url: 'https://austintheatre.org/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-3',
        category: EventCategory.COMEDY,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-4' } },
      update: {},
      create: {
        venueId: venues[1].id,
        title: 'Classic Film Series: Casablanca',
        description: 'Screening of the 1942 classic on the big screen',
        startDateTime: addDays(3),
        url: 'https://austintheatre.org/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-4',
        category: EventCategory.OTHER,
      },
    }),
    // ACL Live events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-5' } },
      update: {},
      create: {
        venueId: venues[2].id,
        title: 'Khruangbin',
        description: 'Psychedelic soul trio from Houston',
        startDateTime: addDays(21),
        url: 'https://acl-live.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-5',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-6' } },
      update: {},
      create: {
        venueId: venues[2].id,
        title: 'Austin City Limits Taping: Leon Bridges',
        description: 'Live taping for the legendary PBS series',
        startDateTime: addDays(7),
        url: 'https://acl-live.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-6',
        category: EventCategory.CONCERT,
      },
    }),
    // Stubb's events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-7' } },
      update: {},
      create: {
        venueId: venues[3].id,
        title: 'Turnstile with Snail Mail',
        description: 'Hardcore punk meets indie rock',
        startDateTime: addDays(10),
        url: 'https://stubbsaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-7',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-8' } },
      update: {},
      create: {
        venueId: venues[3].id,
        title: 'Gospel Brunch',
        description: 'Sunday gospel music with BBQ buffet',
        startDateTime: addDays(4),
        url: 'https://stubbsaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-8',
        category: EventCategory.CONCERT,
      },
    }),
    // Emo's events
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-9' } },
      update: {},
      create: {
        venueId: venues[4].id,
        title: 'Local Natives',
        description: 'Indie rock from Los Angeles',
        startDateTime: addDays(18),
        url: 'https://emosaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-9',
        category: EventCategory.CONCERT,
      },
    }),
    prisma.event.upsert({
      where: { source_sourceEventId: { source: 'MANUAL', sourceEventId: 'seed-10' } },
      update: {},
      create: {
        venueId: venues[4].id,
        title: 'Remi Wolf',
        description: 'Funk-pop sensation',
        startDateTime: addDays(2),
        url: 'https://emosaustin.com/events',
        source: EventSource.MANUAL,
        sourceEventId: 'seed-10',
        category: EventCategory.CONCERT,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

### Task 1.4: Configure Seed Script in package.json

**Action**: Add to `package.json` under existing fields

**Find this section**:
```json
"scripts": {
```

**Add these entries inside scripts**:
```json
"db:seed": "npx tsx prisma/seed.ts",
"db:reset": "npx prisma migrate reset --force",
```

**Also add at the end of package.json (before the closing `}`)**:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

---

### Task 1.5: Install tsx for Seed Script

**Action**: Run terminal command
```bash
npm install -D tsx
```

---

### Task 1.6: Run Seed Script

**Action**: Run terminal command
```bash
npm run db:seed
```

**Expected output**:
```
🌱 Seeding database...
✅ Created 5 venues
✅ Created 10 events
🌱 Seeding complete!
```

**Verify**: Run `npx prisma studio` - check Venue and Event tables have data

---

### Task 1.7: Create Events Data Access Layer

**Action**: Create file `src/db/events.ts`

**Content**:
```typescript
import prisma from './prisma';
import { Event, Venue, EventCategory, EventStatus } from '@prisma/client';

export type EventWithVenue = Event & { venue: Venue };

export interface GetEventsParams {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  venueId?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

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

  const where: Record<string, unknown> = {};

  // Default: only show future events
  if (startDate || endDate) {
    where.startDateTime = {};
    if (startDate) (where.startDateTime as Record<string, Date>).gte = startDate;
    if (endDate) (where.startDateTime as Record<string, Date>).lte = endDate;
  } else {
    where.startDateTime = { gte: new Date() };
  }

  if (category) where.category = category;
  if (venueId) where.venueId = venueId;
  if (status) where.status = status;

  return prisma.event.findMany({
    where,
    include: { venue: true },
    orderBy: { startDateTime: 'asc' },
    take: limit,
    skip: offset,
  });
}

export async function getEventById(id: string): Promise<EventWithVenue | null> {
  return prisma.event.findUnique({
    where: { id },
    include: { venue: true },
  });
}

export async function getEventsByDate(date: Date): Promise<EventWithVenue[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.event.findMany({
    where: {
      startDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'SCHEDULED',
    },
    include: { venue: true },
    orderBy: { startDateTime: 'asc' },
  });
}

// Group events by date for display
export function groupEventsByDate(events: EventWithVenue[]): Map<string, EventWithVenue[]> {
  const grouped = new Map<string, EventWithVenue[]>();
  
  for (const event of events) {
    const dateKey = event.startDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  }
  
  return grouped;
}
```

---

### Task 1.8: Create Venues Data Access Layer

**Action**: Create file `src/db/venues.ts`

**Content**:
```typescript
import prisma from './prisma';
import { Venue } from '@prisma/client';

export async function getVenues(): Promise<Venue[]> {
  return prisma.venue.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getVenueById(id: string): Promise<Venue | null> {
  return prisma.venue.findUnique({
    where: { id },
  });
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  return prisma.venue.findUnique({
    where: { slug },
  });
}
```

---

### Task 1.9: Create API Route - GET /api/events

**Action**: Create file `src/app/api/events/route.ts`

**Content**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/db/events';
import { EventCategory, EventStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const category = searchParams.get('category') as EventCategory | null;
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status') as EventStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const events = await getEvents({
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      endDate: endDateParam ? new Date(endDateParam) : undefined,
      category: category || undefined,
      venueId: venueId || undefined,
      status: status || undefined,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
```

---

### Task 1.10: Create API Route - GET /api/events/[id]

**Action**: Create file `src/app/api/events/[id]/route.ts`

**Content**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/db/events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
```

---

### Task 1.11: Create Date Formatting Utilities

**Action**: Create file `src/lib/utils.ts`

**Content**:
```typescript
import { format, formatDistanceToNow, isToday, isTomorrow, isThisWeek } from 'date-fns';

export function formatEventDate(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE 'at' h:mm a"); // "Friday at 8:00 PM"
  }
  return format(date, "EEE, MMM d 'at' h:mm a"); // "Fri, Jan 15 at 8:00 PM"
}

export function formatDateHeading(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d'); // "Friday, January 15"
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

---

### Task 1.12: Create Event Card Component

**Action**: Create file `src/components/EventCard.tsx`

**Content**:
```typescript
import Link from 'next/link';
import { EventWithVenue } from '@/db/events';
import { formatEventDate } from '@/lib/utils';

interface EventCardProps {
  event: EventWithVenue;
}

export function EventCard({ event }: EventCardProps) {
  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const statusBadge = event.status !== 'SCHEDULED' && (
    <span className={`
      px-2 py-0.5 text-xs font-medium rounded
      ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
      ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 line-through' : ''}
      ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
    `}>
      {event.status.replace('_', ' ')}
    </span>
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {statusBadge}
          </div>
          
          <h3 className="font-semibold text-gray-900 truncate">
            {event.title}
          </h3>
          
          <p className="text-sm text-gray-600 mt-1">
            {event.venue.name}
          </p>
          
          <p className="text-sm text-gray-500 mt-1">
            {formatEventDate(event.startDateTime)}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

---

### Task 1.13: Create Home Page

**Action**: Replace content of `src/app/page.tsx`

**Content**:
```typescript
import { getEvents, groupEventsByDate } from '@/db/events';
import { EventCard } from '@/components/EventCard';
import { formatDateHeading } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function HomePage() {
  const events = await getEvents({ limit: 50 });
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Austin Events
          </h1>
          <p className="text-gray-600 mt-2">
            Concerts, comedy, and more happening in Austin, TX
          </p>
        </header>

        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No upcoming events found.</p>
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
      </div>
    </main>
  );
}
```

---

### Task 1.14: Create Event Detail Page

**Action**: Create file `src/app/events/[id]/page.tsx`

**Content**:
```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/db/events';
import { format } from 'date-fns';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to events
        </Link>

        {/* Event header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {event.status !== 'SCHEDULED' && (
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded
                ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
                ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
              `}>
                {event.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">
                  {format(event.startDateTime, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">
                  {format(event.startDateTime, 'h:mm a')}
                  {event.endDateTime && ` - ${format(event.endDateTime, 'h:mm a')}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium text-gray-900">{event.venue.name}</p>
                {event.venue.address && (
                  <p className="text-sm">{event.venue.address}, {event.venue.city}, {event.venue.state}</p>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {event.url && (
            <div className="mt-6">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Tickets →
              </a>
            </div>
          )}
        </div>

        {/* Attendance section - placeholder for Phase 3 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Are you going?</h2>
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
            >
              ✓ Going
            </button>
            <button
              disabled
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
            >
              ★ Interested
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Sign in to mark your attendance
          </p>
        </div>
      </div>
    </main>
  );
}
```

---

### Task 1.15: Create Not Found Page for Events

**Action**: Create file `src/app/events/[id]/not-found.tsx`

**Content**:
```typescript
import Link from 'next/link';

export default function EventNotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p className="text-gray-600 mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to events
        </Link>
      </div>
    </main>
  );
}
```

---

### Task 1.16: Update Root Layout

**Action**: Replace content of `src/app/layout.tsx`

**Content**:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Austin Events Calendar',
  description: 'Discover concerts, comedy, theater, and more happening in Austin, TX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

### Task 1.17: Verify Build

**Action**: Run terminal command
```bash
npm run build
```

**Expected output**: Build completes successfully with no errors

---

### Task 1.18: Test Application

**Action**: Run terminal command
```bash
npm run dev
```

**Verify manually**:
- [ ] Home page loads at http://localhost:3000
- [ ] Events are displayed grouped by date
- [ ] Click an event → navigates to detail page
- [ ] Detail page shows all event info
- [ ] "Back to events" link works
- [ ] "Get Tickets" button links correctly
- [ ] API works: http://localhost:3000/api/events

---

### ✅ Phase 1 Checkpoint

Before proceeding, verify:
- [ ] Database has 5 venues and 10 events (check Prisma Studio)
- [ ] `npm run build` succeeds
- [ ] Home page displays events grouped by date
- [ ] Event detail page works for all events
- [ ] API returns JSON at `/api/events`
- [ ] No console errors in browser

---

## Phase 2: Authentication

### Task 2.1: Create Auth Callback Route

**Action**: Create file `src/app/auth/callback/route.ts`

**Content**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}
```

---

### Task 2.2: Create Login Page

**Action**: Create file `src/app/login/page.tsx`

**Content**:
```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
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
            <form onSubmit={handleLogin}>
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
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

### Task 2.3: Create Auth Error Page

**Action**: Create file `src/app/auth/error/page.tsx`

**Content**:
```typescript
import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          Something went wrong. The link may have expired.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
```

---

### Task 2.4: Create Users Data Access Layer

**Action**: Create file `src/db/users.ts`

**Content**:
```typescript
import prisma from './prisma';
import { User } from '@prisma/client';

export async function getUserByAuthId(authProviderId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { authProviderId },
  });
}

export async function createOrUpdateUser(data: {
  authProviderId: string;
  email: string;
  displayName?: string | null;
}): Promise<User> {
  return prisma.user.upsert({
    where: { authProviderId: data.authProviderId },
    update: {
      email: data.email,
      displayName: data.displayName,
    },
    create: {
      authProviderId: data.authProviderId,
      email: data.email,
      displayName: data.displayName,
    },
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}
```

---

### Task 2.5: Create Auth Helpers

**Action**: Create file `src/lib/auth.ts`

**Content**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { createOrUpdateUser, getUserByAuthId } from '@/db/users';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';

export interface AuthUser {
  supabaseUser: {
    id: string;
    email: string;
  };
  dbUser: User;
}

/**
 * Get the current authenticated user (Supabase + DB user)
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    return null;
  }

  // Sync user to database (create if doesn't exist)
  const dbUser = await createOrUpdateUser({
    authProviderId: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.display_name || null,
  });

  return {
    supabaseUser: {
      id: supabaseUser.id,
      email: supabaseUser.email,
    },
    dbUser,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
```

---

### Task 2.6: Create Logout API Route

**Action**: Create file `src/app/api/auth/logout/route.ts`

**Content**:
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  return NextResponse.json({ success: true });
}
```

---

### Task 2.7: Create Header Component

**Action**: Create file `src/components/Header.tsx`

**Content**:
```typescript
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Austin Events
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <UserMenu email={user.supabaseUser.email} />
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

---

### Task 2.8: Create User Menu Component

**Action**: Create file `src/components/UserMenu.tsx`

**Content**:
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium">
          {email[0].toUpperCase()}
        </span>
        <span className="hidden sm:inline max-w-[150px] truncate">{email}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              My Profile
            </Link>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### Task 2.9: Create Profile Page

**Action**: Create file `src/app/profile/page.tsx`

**Content**:
```typescript
import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/Header';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

          {/* User info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.supabaseUser.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.dbUser.displayName || 'No display name'}</p>
                <p className="text-gray-600">{user.supabaseUser.email}</p>
              </div>
            </div>
          </div>

          {/* Going section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Events I'm Going To
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              <p>No events yet</p>
              <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Browse events →
              </Link>
            </div>
          </section>

          {/* Interested section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Events I'm Interested In
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              <p>No events yet</p>
              <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Browse events →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
```

---

### Task 2.10: Update Root Layout with Header

**Action**: Replace content of `src/app/layout.tsx`

**Content**:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Austin Events Calendar',
  description: 'Discover concerts, comedy, theater, and more happening in Austin, TX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

### Task 2.11: Update Home Page with Header

**Action**: Update `src/app/page.tsx` to include Header

**Replace the entire file with**:
```typescript
import { getEvents, groupEventsByDate } from '@/db/events';
import { EventCard } from '@/components/EventCard';
import { Header } from '@/components/Header';
import { formatDateHeading } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await getEvents({ limit: 50 });
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Upcoming Events
            </h1>
            <p className="text-gray-600 mt-2">
              Concerts, comedy, and more happening in Austin, TX
            </p>
          </header>

          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No upcoming events found.</p>
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
        </div>
      </main>
    </>
  );
}
```

---

### Task 2.12: Update Event Detail Page with Header

**Action**: Update `src/app/events/[id]/page.tsx` to include Header

**Replace the entire file with**:
```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/db/events';
import { Header } from '@/components/Header';
import { format } from 'date-fns';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Back to events
          </Link>

          {/* Event header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
                {event.category}
              </span>
              {event.status !== 'SCHEDULED' && (
                <span className={`
                  px-2 py-0.5 text-xs font-medium rounded
                  ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
                  ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                  ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
                `}>
                  {event.status.replace('_', ' ')}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {format(event.startDateTime, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm">
                    {format(event.startDateTime, 'h:mm a')}
                    {event.endDateTime && ` - ${format(event.endDateTime, 'h:mm a')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-medium text-gray-900">{event.venue.name}</p>
                  {event.venue.address && (
                    <p className="text-sm">{event.venue.address}, {event.venue.city}, {event.venue.state}</p>
                  )}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600">{event.description}</p>
              </div>
            )}

            {event.url && (
              <div className="mt-6">
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Tickets →
                </a>
              </div>
            )}
          </div>

          {/* Attendance section - placeholder for Phase 3 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Are you going?</h2>
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
              >
                ✓ Going
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
              >
                ★ Interested
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Sign in to mark your attendance
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
```

---

### Task 2.13: Configure Supabase Email Templates (Manual Step)

**User action required**: In Supabase Dashboard:
1. Go to **Authentication → Email Templates**
2. Configure "Magic Link" template (optional customization)
3. Go to **Authentication → URL Configuration**
4. Set **Site URL** to your app URL (e.g., `http://localhost:3000` for dev)
5. Add **Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback` (add after deploy)

---

### Task 2.14: Verify Build

**Action**: Run terminal command
```bash
npm run build
```

**Expected output**: Build completes successfully

---

### Task 2.15: Test Authentication Flow

**Action**: Run `npm run dev` and test manually

**Verify**:
- [ ] "Sign in" button appears in header when logged out
- [ ] Click "Sign in" → navigates to login page
- [ ] Enter email, click "Send magic link" → success message shown
- [ ] Check email, click magic link → redirects to app, now logged in
- [ ] User avatar/email appears in header
- [ ] Click user menu → shows "My Profile" and "Sign out"
- [ ] Click "My Profile" → navigates to profile page
- [ ] Profile page shows user email and empty event sections
- [ ] Click "Sign out" → logs out, "Sign in" button reappears
- [ ] Try accessing `/profile` when logged out → redirects to login
- [ ] Check database (Prisma Studio) → User record created

---

### ✅ Phase 2 Checkpoint

Before proceeding, verify:
- [ ] Can sign in with email magic link
- [ ] Can sign out
- [ ] Profile page loads when authenticated
- [ ] Profile redirects to login when not authenticated
- [ ] User record created in database after login
- [ ] `npm run build` succeeds
- [ ] No console errors

---

## Next Phases

Phase 3 (Social Layer), Phase 4 (Ingestion), Phase 5 (Automation), and Phase 6 (Polish) will be documented when ready to begin. Each will follow the same granular format.

---

## Quick Reference: File Structure After Phase 2

```
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── logout/
│   │   │   │       └── route.ts
│   │   │   └── events/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts
│   │   │   └── error/
│   │   │       └── page.tsx
│   │   ├── events/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── not-found.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── Header.tsx
│   │   └── UserMenu.tsx
│   ├── db/
│   │   ├── prisma.ts
│   │   ├── events.ts
│   │   ├── users.ts
│   │   └── venues.ts
│   ├── ingestion/
│   │   └── sources/
│   └── lib/
│       ├── auth.ts
│       ├── utils.ts
│       └── supabase/
│           ├── client.ts
│           └── server.ts
├── .env.local
├── .env.local.example
├── .gitignore
├── package.json
└── tsconfig.json
```

