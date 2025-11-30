# Phase 1: Social Tab + Squads - Task List

This document contains granular, step-by-step tasks for Phase 1.
Each task includes exact commands, file paths, and verification steps.

**Prerequisite**: Phase 0 (Ticket Statuses) is complete.

**Branch**: Create `feature/social-tab-squads` before starting.

**Estimated Time**: 2-3 weeks

---

## Overview

Phase 1 replaces the SocialSidebar with a new Social Tab and adds Squad rooms for event coordination.

**Major Deliverables**:
1. Kill SocialSidebar → New Calendar/Social toggle
2. Social Tab with 3 sections (Your Plans / Almost Plans / Ticket Activity)
3. Squad data model and rooms
4. "Go Together" button creates Squads
5. Export "Share plan" text templates

---

## Sub-Phase 1A: Navigation & Social Tab Structure

### Task 1A.1: Create Calendar/Social Toggle Component

**Action**: Create file `src/components/ViewToggle.tsx`

```typescript
'use client';

import { useState } from 'react';

interface ViewToggleProps {
  defaultView?: 'calendar' | 'social';
  onViewChange?: (view: 'calendar' | 'social') => void;
}

export function ViewToggle({ defaultView = 'calendar', onViewChange }: ViewToggleProps) {
  const [view, setView] = useState<'calendar' | 'social'>(defaultView);

  const handleChange = (newView: 'calendar' | 'social') => {
    setView(newView);
    onViewChange?.(newView);
  };

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        onClick={() => handleChange('calendar')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === 'calendar'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📅 Calendar
      </button>
      <button
        onClick={() => handleChange('social')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === 'social'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        👥 Social
      </button>
    </div>
  );
}
```

**Verify**: Component renders without errors

---

### Task 1A.2: Create Social Tab Container

**Action**: Create file `src/components/SocialTab.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { SocialSectionA } from './social/SocialSectionA';
import { SocialSectionB } from './social/SocialSectionB';
import { SocialSectionC } from './social/SocialSectionC';

export function SocialTab() {
  const [loading, setLoading] = useState(true);
  
  // TODO: Fetch social data
  
  return (
    <div className="space-y-6">
      {/* Section A: Your Plans */}
      <SocialSectionA />
      
      {/* Section B: Almost Plans */}
      <SocialSectionB />
      
      {/* Section C: Ticket Activity */}
      <SocialSectionC />
    </div>
  );
}
```

**Note**: Section components will be created in subsequent tasks.

---

### Task 1A.3: Create Section A - Your Plans

**Action**: Create file `src/components/social/SocialSectionA.tsx`

**Content**: Display events where user has a Squad OR is marked Going.

**Questions to clarify**:
- Q1: Should we show a "Create Squad" button on Going events that don't have a Squad yet?
- Q2: How many events to show before "View all" link?

---

### Task 1A.4: Create Section B - Almost Plans

**Action**: Create file `src/components/social/SocialSectionB.tsx`

**Content**: Events where user is Interested/Going AND at least 1 friend is Interested/Going AND no Squad exists.

**Questions to clarify**:
- Q3: What's the threshold for showing "Go Together" prompt? 1 friend? 2 friends?
- Q4: Should we prioritize events by number of friends interested?

---

### Task 1A.5: Create Section C - Ticket Activity

**Action**: Create file `src/components/social/SocialSectionC.tsx`

**Content**: Friends who Need Tickets or Have Tickets for upcoming events.

**Questions to clarify**:
- Q5: Show all ticket activity or just this week?
- Q6: Group by event or show as a feed?

---

### Task 1A.6: Create New Sidebar Content

**Action**: Create file `src/components/CalendarSidebar.tsx`

**Content**: Replaces SocialSidebar with:
- "Just Listed" (events added in last 24-48 hours)
- "Presales" (events with presale dates coming up)
- "Your Calendar" (quick view of your Going events)

**Questions to clarify**:
- Q7: How do we track "Just Listed"? Use `createdAt` on Event?
- Q8: Do we have presale data reliably from TM enrichment?

---

### Task 1A.7: Update Home Page with Toggle

**Action**: Update `src/app/page.tsx`

- Add ViewToggle at top
- Conditionally render EventListWithPagination (Calendar) or SocialTab
- Replace SocialSidebar with CalendarSidebar

**Verify**:
- [ ] Toggle switches between Calendar and Social views
- [ ] Calendar view shows events as before
- [ ] Social view shows placeholder sections
- [ ] New sidebar shows on right

---

### Task 1A.8: Delete Old SocialSidebar

**Action**: Delete or deprecate `src/components/SocialSidebar.tsx`

**Verify**: App still builds after removal

---

### ✅ Sub-Phase 1A Checkpoint

- [ ] Calendar/Social toggle works
- [ ] Social Tab renders 3 sections
- [ ] New sidebar replaces old SocialSidebar
- [ ] `npm run build` succeeds

---

## Sub-Phase 1B: Social Tab Data Layer

### Task 1B.1: Create Social Data Fetching Functions

**Action**: Create file `src/db/social.ts`

```typescript
import prisma from './prisma';
import { getFriendIds } from './friends';

/**
 * Get events for Section A: Your Plans
 * - Events where user has a Squad
 * - Events where user is Going
 */
export async function getYourPlans(userId: string) {
  // TODO: Implement
  // 1. Get events where user has a SquadMember record
  // 2. Get events where user has Going status
  // 3. Merge and dedupe
  // 4. Return with Squad info attached
}

/**
 * Get events for Section B: Almost Plans
 * - User is Interested or Going
 * - At least 1 friend is Interested or Going
 * - User does NOT have a Squad for this event
 */
export async function getAlmostPlans(userId: string) {
  // TODO: Implement
}

/**
 * Get ticket activity for Section C
 * - Friends who Need Tickets or Have Tickets
 */
export async function getTicketActivity(userId: string) {
  // TODO: Implement
}
```

---

### Task 1B.2: Create API Endpoint for Social Tab

**Action**: Create file `src/app/api/social/route.ts`

**Content**: Returns all social data in one request.

```typescript
// GET /api/social
// Returns: { yourPlans: [], almostPlans: [], ticketActivity: [] }
```

---

### Task 1B.3: Wire Up Social Tab to API

**Action**: Update `src/components/SocialTab.tsx`

- Fetch from `/api/social` on mount
- Pass data to section components
- Show loading state

**Verify**:
- [ ] API returns data structure
- [ ] Social Tab displays real data
- [ ] Loading state works

---

### ✅ Sub-Phase 1B Checkpoint

- [ ] Social data functions work
- [ ] API endpoint returns correct data
- [ ] Social Tab shows real events
- [ ] `npm run build` succeeds

---

## Sub-Phase 1C: Squad Data Model

### Task 1C.1: Add Squad Models to Schema

**Action**: Update `prisma/schema.prisma`

Add after existing models:

```prisma
// Squad - A planning room for one event with a group of friends
model Squad {
  id          String   @id @default(uuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User     @relation("SquadCreator", fields: [createdById], references: [id])
  
  // Logistics
  meetTime    DateTime?
  meetSpot    String?
  deadline    DateTime?  // For ticket purchase deadline
  playlistUrl String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     SquadMember[]
  
  @@index([eventId])
  @@index([createdById])
}

model SquadMember {
  id             String   @id @default(uuid())
  squadId        String
  squad          Squad    @relation(fields: [squadId], references: [id], onDelete: Cascade)
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Status within squad
  status         SquadMemberStatus @default(THINKING)
  budget         SquadBudget?
  ticketStatus   SquadTicketStatus @default(NOT_BOUGHT)
  buyingForCount Int?     // If buying for others, how many
  
  isOrganizer    Boolean  @default(false)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([squadId, userId])  // One membership per user per squad
  @@index([userId])
}

enum SquadMemberStatus {
  THINKING
  IN
  OUT
}

enum SquadBudget {
  NO_PREFERENCE
  UNDER_50
  FIFTY_TO_100
  OVER_100
}

enum SquadTicketStatus {
  NOT_BOUGHT
  BUYING_OWN
  BUYING_FOR_OTHERS
}
```

**Also update User model** to add relations:

```prisma
model User {
  // ... existing fields ...
  
  // Add these relations:
  squadsCreated  Squad[]       @relation("SquadCreator")
  squadMembers   SquadMember[]
}
```

**Also update Event model** to add relation:

```prisma
model Event {
  // ... existing fields ...
  
  squads    Squad[]
}
```

---

### Task 1C.2: Run Migration

**Action**: Run terminal commands

```bash
npx prisma migrate dev --name add_squads
npx prisma generate
```

**Verify**: Migration succeeds, no errors

---

### Task 1C.3: Create Squad Data Functions

**Action**: Create file `src/db/squads.ts`

```typescript
import prisma from './prisma';
import { SquadMemberStatus, SquadBudget, SquadTicketStatus } from '@prisma/client';

/**
 * Create a new Squad for an event
 */
export async function createSquad(data: {
  eventId: string;
  createdById: string;
}) {
  // Check if user already has a squad for this event
  const existing = await prisma.squadMember.findFirst({
    where: {
      userId: data.createdById,
      squad: { eventId: data.eventId },
    },
  });
  
  if (existing) {
    throw new Error('You already have a squad for this event');
  }
  
  // Create squad with creator as organizer
  return prisma.squad.create({
    data: {
      eventId: data.eventId,
      createdById: data.createdById,
      members: {
        create: {
          userId: data.createdById,
          isOrganizer: true,
          status: 'IN',
        },
      },
    },
    include: {
      members: { include: { user: true } },
      event: { include: { venue: true } },
    },
  });
}

/**
 * Get a Squad by ID with all relations
 */
export async function getSquadById(squadId: string) {
  return prisma.squad.findUnique({
    where: { id: squadId },
    include: {
      event: { include: { venue: true } },
      members: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Get user's Squad for a specific event (if any)
 */
export async function getUserSquadForEvent(userId: string, eventId: string) {
  const membership = await prisma.squadMember.findFirst({
    where: {
      userId,
      squad: { eventId },
    },
    include: {
      squad: {
        include: {
          event: { include: { venue: true } },
          members: { include: { user: true } },
        },
      },
    },
  });
  
  return membership?.squad || null;
}

/**
 * Update member's status in a squad
 */
export async function updateSquadMemberStatus(
  squadId: string,
  userId: string,
  data: {
    status?: SquadMemberStatus;
    budget?: SquadBudget | null;
    ticketStatus?: SquadTicketStatus;
    buyingForCount?: number | null;
  }
) {
  return prisma.squadMember.update({
    where: {
      squadId_userId: { squadId, userId },
    },
    data,
  });
}

/**
 * Update squad logistics (organizer only)
 */
export async function updateSquadLogistics(
  squadId: string,
  data: {
    meetTime?: Date | null;
    meetSpot?: string | null;
    deadline?: Date | null;
    playlistUrl?: string | null;
  }
) {
  return prisma.squad.update({
    where: { id: squadId },
    data,
  });
}

/**
 * Add a member to a squad
 */
export async function addSquadMember(squadId: string, userId: string) {
  // Check if user already has a squad for this event
  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    select: { eventId: true },
  });
  
  if (!squad) throw new Error('Squad not found');
  
  const existing = await prisma.squadMember.findFirst({
    where: {
      userId,
      squad: { eventId: squad.eventId },
    },
  });
  
  if (existing) {
    throw new Error('User already has a squad for this event');
  }
  
  return prisma.squadMember.create({
    data: {
      squadId,
      userId,
      status: 'THINKING',
    },
  });
}

/**
 * Get all squads for a user
 */
export async function getUserSquads(userId: string) {
  return prisma.squad.findMany({
    where: {
      members: { some: { userId } },
      event: { startDateTime: { gte: new Date() } },
    },
    include: {
      event: { include: { venue: true } },
      members: { include: { user: true } },
    },
    orderBy: { event: { startDateTime: 'asc' } },
  });
}
```

---

### ✅ Sub-Phase 1C Checkpoint

- [ ] Squad models added to schema
- [ ] Migration runs successfully
- [ ] Squad data functions work
- [ ] `npm run build` succeeds

---

## Sub-Phase 1D: Squad Room UI

### Task 1D.1: Create Squad Room Page

**Action**: Create file `src/app/squads/[id]/page.tsx`

**Content**: Full Squad room with:
- Header (event info, avatar stack)
- Your Status section (status, budget, tickets)
- Squad Snapshot (summary of all members)
- Logistics section (meet time, spot)
- Playlist section (optional)

**Questions to clarify**:
- Q9: Full page or modal/drawer?
- Q10: Should logistics be editable by any member or organizer only?

---

### Task 1D.2: Create Squad Status Controls Component

**Action**: Create file `src/components/squad/SquadStatusControls.tsx`

**Content**: The "Your Status" card with segmented controls for:
- Status: Thinking / In / Out
- Budget: No pref / <$50 / $50-100 / $100+
- Tickets: Not bought / Buying own / Buying for others

---

### Task 1D.3: Create Squad Snapshot Component

**Action**: Create file `src/components/squad/SquadSnapshot.tsx`

**Content**: Human-readable summary:
```
Squad snapshot
5 invited · 3 In · 1 Thinking · 1 Out
2 have bought tickets · 1 is buying for 2 more

Progress: ████░░ 2/4 people In have tickets
```

---

### Task 1D.4: Create Squad Logistics Component

**Action**: Create file `src/components/squad/SquadLogistics.tsx`

**Content**: Meet time and spot inputs (time picker, text field).

---

### Task 1D.5: Create Squad API Endpoints

**Action**: Create files:
- `src/app/api/squads/route.ts` - POST to create squad
- `src/app/api/squads/[id]/route.ts` - GET squad, PUT update
- `src/app/api/squads/[id]/members/route.ts` - POST add member
- `src/app/api/squads/[id]/status/route.ts` - PUT update member status

---

### Task 1D.6: Create "Go Together" Button

**Action**: Create file `src/components/GoTogetherButton.tsx`

**Logic**:
- If user has no squad for event → "Go Together" → creates squad
- If user has squad → "View Squad" → opens squad room
- If viewing via shared squad link → "Join Squad" → adds to squad

---

### Task 1D.7: Add Go Together Button to Event Detail Page

**Action**: Update `src/app/events/[id]/page.tsx`

- Add GoTogetherButton below attendance section
- Fetch user's squad for this event (if any)

**Verify**:
- [ ] Button shows correct state
- [ ] Creating squad works
- [ ] Navigating to squad room works

---

### ✅ Sub-Phase 1D Checkpoint

- [ ] Squad room page works
- [ ] Status controls update correctly
- [ ] Snapshot shows accurate summary
- [ ] Logistics editing works
- [ ] Go Together button works
- [ ] `npm run build` succeeds

---

## Sub-Phase 1E: Share Plan Export

### Task 1E.1: Create Share Plan Text Generator

**Action**: Create file `src/lib/squadShareText.ts`

```typescript
import { Squad, SquadMember, Event, Venue } from '@prisma/client';

type SquadWithRelations = Squad & {
  event: Event & { venue: Venue };
  members: (SquadMember & { user: { displayName: string | null; email: string } })[];
};

/**
 * Generate share text based on user's ticket status
 */
export function generateSharePlanText(
  squad: SquadWithRelations,
  userMember: SquadMember
): string {
  const eventName = squad.event.title;
  const eventDate = formatDate(squad.event.startDateTime);
  const squadLink = `${process.env.NEXT_PUBLIC_APP_URL}/squads/${squad.id}`;
  
  // Get budget range text
  const budgetText = getBudgetText(userMember.budget);
  
  // Get deadline text if set
  const deadlineText = squad.deadline 
    ? ` by ${formatDate(squad.deadline)}`
    : '';
  
  switch (userMember.ticketStatus) {
    case 'BUYING_FOR_OTHERS':
      return `I'm organizing ${eventName} on ${eventDate}. ${budgetText}I'm grabbing tickets for people who are in${deadlineText}. Mark your status here: ${squadLink} and send me your Venmo!`;
    
    case 'BUYING_OWN':
      return `Thinking of going to ${eventName} on ${eventDate}${budgetText ? ` (${budgetText.toLowerCase()})` : ''}. If you're in, mark it and grab a ticket so we can coordinate: ${squadLink}`;
    
    default:
      return `Interested in ${eventName} on ${eventDate}. Mark if you're in & your budget here, and we'll figure out tickets: ${squadLink}`;
  }
}

/**
 * Generate day-of logistics text
 */
export function generateDayOfText(squad: SquadWithRelations): string {
  const eventName = squad.event.title;
  const meetTime = squad.meetTime ? formatTime(squad.meetTime) : null;
  const meetSpot = squad.meetSpot;
  const squadLink = `${process.env.NEXT_PUBLIC_APP_URL}/squads/${squad.id}`;
  
  let text = `Tonight: ${eventName}!`;
  
  if (meetTime && meetSpot) {
    text += ` We're meeting at ${meetTime} at ${meetSpot}, then heading to the show.`;
  } else if (meetTime) {
    text += ` We're meeting at ${meetTime}.`;
  } else if (meetSpot) {
    text += ` We're meeting at ${meetSpot}.`;
  }
  
  text += ` Squad details & who's coming: ${squadLink}`;
  
  return text;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

function getBudgetText(budget: string | null): string {
  switch (budget) {
    case 'UNDER_50': return 'Budget is under $50. ';
    case 'FIFTY_TO_100': return 'Budget is around $50-100. ';
    case 'OVER_100': return 'Budget is $100+. ';
    default: return '';
  }
}
```

---

### Task 1E.2: Add Share Buttons to Squad Room

**Action**: Update Squad room page

Add two share buttons:
- "Share Plan" → copies pre-purchase text
- "Share Day-of" → copies logistics text (only if meetTime or meetSpot set)

---

### ✅ Sub-Phase 1E Checkpoint

- [ ] Share Plan generates correct text
- [ ] Share Day-of generates correct text
- [ ] Copy to clipboard works
- [ ] Text varies by ticket status

---

## Sub-Phase 1F: Polish & Integration

### Task 1F.1: Update Social Tab with Real Squad Data

- Section A shows events with Squads
- Clicking opens Squad room
- Shows member count and status summary

---

### Task 1F.2: Add Squad Indicators to Event Cards

- Small "👥 Squad" badge on events where user has a Squad
- Shows in both Calendar and Social views

---

### Task 1F.3: Handle Squad Invites via Share Links

- When user opens `/squads/[id]` and not a member
- Show "Join Squad" button
- Enforce: one user, one squad per event

---

### Task 1F.4: Add Empty States

- Social Tab with no plans: "Mark some events as Going or create a Squad"
- Social Tab with no friends: "Add friends to see what they're doing"

---

### Task 1F.5: Final Testing

**Verify**:
- [ ] Calendar/Social toggle works
- [ ] All 3 Social Tab sections populate correctly
- [ ] Creating Squad works
- [ ] Joining Squad via link works
- [ ] Status updates work
- [ ] Share text generates correctly
- [ ] Squad room shows all members
- [ ] Mobile responsive

---

### ✅ Phase 1 Complete Checkpoint

- [ ] SocialSidebar replaced with CalendarSidebar
- [ ] Calendar/Social toggle works
- [ ] Social Tab shows Your Plans / Almost Plans / Ticket Activity
- [ ] Squad data model complete
- [ ] Squad room fully functional
- [ ] Go Together button creates Squads
- [ ] Share Plan text export works
- [ ] `npm run build` succeeds
- [ ] All features work on mobile

---

## Open Questions Summary

| # | Question | Default If No Answer |
|---|----------|---------------------|
| Q1 | Show "Create Squad" on Going events without Squad? | Yes |
| Q2 | How many events before "View all" in sections? | 5 |
| Q3 | Friend threshold for "Go Together" prompt? | 1 friend |
| Q4 | Prioritize events by friend count? | Yes |
| Q5 | Ticket activity timeframe? | Next 2 weeks |
| Q6 | Ticket activity grouping? | By event |
| Q7 | "Just Listed" tracking? | Events with `createdAt` in last 48 hours |
| Q8 | Presale data from TM? | Yes, use `tmOnSaleStart` if available |
| Q9 | Squad room: page or modal? | Full page |
| Q10 | Logistics editing: any member or organizer? | Organizer only |

---

## Files Created/Modified Summary

**New Files**:
- `src/components/ViewToggle.tsx`
- `src/components/SocialTab.tsx`
- `src/components/social/SocialSectionA.tsx`
- `src/components/social/SocialSectionB.tsx`
- `src/components/social/SocialSectionC.tsx`
- `src/components/CalendarSidebar.tsx`
- `src/components/GoTogetherButton.tsx`
- `src/components/squad/SquadStatusControls.tsx`
- `src/components/squad/SquadSnapshot.tsx`
- `src/components/squad/SquadLogistics.tsx`
- `src/db/social.ts`
- `src/db/squads.ts`
- `src/lib/squadShareText.ts`
- `src/app/squads/[id]/page.tsx`
- `src/app/api/social/route.ts`
- `src/app/api/squads/route.ts`
- `src/app/api/squads/[id]/route.ts`
- `src/app/api/squads/[id]/members/route.ts`
- `src/app/api/squads/[id]/status/route.ts`

**Modified Files**:
- `prisma/schema.prisma` (Squad models)
- `src/app/page.tsx` (toggle, sidebar)
- `src/app/events/[id]/page.tsx` (Go Together button)
- `src/components/EventCard.tsx` (Squad badge)

**Deleted Files**:
- `src/components/SocialSidebar.tsx` (replaced)

---

**Last Updated**: November 29, 2025

