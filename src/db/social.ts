import prisma from './prisma';
import { getFriendIds } from './friends';
import { EventDisplay, EnrichmentDisplay } from './events';
import { AttendanceStatus, EventCategory } from '@prisma/client';

export interface SocialFilters {
  venueIds?: string[];
  categories?: string[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Get events for Section A: Your Plans
 * Priority: Going > Squads > Interested, with time buckets (<14d vs >14d)
 * - Events where user is Going
 * - Events where user has a Squad (regardless of personal status)  
 * - Events where user is Interested (no squad)
 */
export async function getYourPlans(userId: string, filters?: SocialFilters): Promise<EventDisplay[]> {
  const now = new Date();
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  // Get friend IDs for social signals
  const friendIds = await getFriendIds(userId);

  // Build date filter
  const dateFilter: { gte?: Date; lte?: Date } = { gte: filters?.startDate || now };
  if (filters?.endDate) {
    dateFilter.lte = filters.endDate;
  }

  // Get all events where user has any involvement
  const allUserEvents = await prisma.event.findMany({
    where: {
      startDateTime: dateFilter,
      // Apply venue filter
      ...(filters?.venueIds?.length ? { venueId: { in: filters.venueIds } } : {}),
      // Apply category filter (cast to EventCategory enum)
      ...(filters?.categories?.length ? { category: { in: filters.categories as EventCategory[] } } : {}),
      OR: [
        // User has a squad
        {
          squads: {
            some: {
              members: { some: { userId } },
            },
          },
        },
        // User has marked status (Going, Interested, etc.)
        {
          userEvents: {
            some: {
              userId,
              status: { in: [AttendanceStatus.GOING, AttendanceStatus.INTERESTED, AttendanceStatus.NEED_TICKETS, AttendanceStatus.HAVE_TICKETS] },
            },
          },
        },
      ],
    },
    include: {
      venue: true,
      userEvents: {
        where: {
          OR: [
            { userId }, // User's status
            { userId: { in: friendIds } }, // Friend statuses for social signals
          ],
        },
        select: { userId: true, status: true },
      },
      squads: {
        where: {
          members: { some: { userId } },
        },
        include: {
          members: {
            select: {
              userId: true,
              createdAt: true,
              isOrganizer: true,
            },
          },
        },
      },
      enrichment: {
        select: {
          spotifyUrl: true,
          kgWikiUrl: true,
          spotifyGenres: true,
          tmUrl: true,
          tmPreferTitle: true,
          tmEventName: true,
        },
      },
    },
  });

  // Process and prioritize events
  const processedEvents = allUserEvents.map(event => {
    const userEvent = event.userEvents.find(ue => ue.userId === userId);
    const friendEvents = event.userEvents.filter(ue => friendIds.includes(ue.userId));
    const userSquad = event.squads.length > 0 ? event.squads[0] : null;
    const hasSquad = !!userSquad;
    const status = userEvent?.status;
    
    // Calculate friend counts
    const friendsGoingCount = friendEvents.filter(fe => fe.status === AttendanceStatus.GOING).length;
    const friendsInterestedCount = friendEvents.filter(fe => fe.status === AttendanceStatus.INTERESTED).length;
    
    // Determine priority level (lower number = higher priority)
    let priority = 5; // default
    if (status === AttendanceStatus.GOING) {
      priority = 1;
    } else if (hasSquad) {
      priority = 2; // Squad membership trumps personal status
    } else if (status === AttendanceStatus.INTERESTED) {
      priority = 3;
    } else if (status === AttendanceStatus.NEED_TICKETS || status === AttendanceStatus.HAVE_TICKETS) {
      priority = 4;
    }
    
    // Add time bucket (within 14 days gets boost)
    const isWithin14Days = new Date(event.startDateTime) <= twoWeeksOut;
    const timePriority = isWithin14Days ? 0 : 100; // 0-99 for <14d, 100+ for >14d
    
    return {
      ...event,
      displayTitle: getDisplayTitle(event),
      enrichment: event.enrichment ? mapEnrichmentForDisplay(event.enrichment) : undefined,
      social: {
        userStatus: status as 'GOING' | 'INTERESTED' || null,
        friendsGoing: friendsGoingCount,
        friendsInterested: friendsInterestedCount,
        communitiesGoing: [],
      },
      // Squad information for smart buttons
      userSquad: userSquad ? {
        id: userSquad.id,
        hasSquad: true,
      } : null,
      // Recent squad metadata
      isRecentSquadAddition: (() => {
        const currentUserMember = userSquad?.members?.find(m => m.userId === userId);
        const memberAddedAt = currentUserMember?.createdAt;
        return memberAddedAt && 
          (new Date().getTime() - new Date(memberAddedAt).getTime()) < (48 * 60 * 60 * 1000);
      })(),
      memberAddedAt: userSquad?.members?.find(m => m.userId === userId)?.createdAt,
      // Metadata for sorting (recent squads get priority boost)
      _priority: (() => {
        const currentUserMember = userSquad?.members?.find(m => m.userId === userId);
        const memberAddedAt = currentUserMember?.createdAt;
        const isRecent = memberAddedAt && 
          (new Date().getTime() - new Date(memberAddedAt).getTime()) < (48 * 60 * 60 * 1000);
        return isRecent ? -100 : (timePriority + priority);
      })(),
      _hasSquad: hasSquad,
    };
  });

  // Sort by priority (time bucket first, then status priority)
  const sortedEvents = processedEvents.sort((a, b) => a._priority - b._priority);

  // Remove metadata and return top 20
  return sortedEvents.slice(0, 20).map(({ _priority, _hasSquad, ...event }) => event);
}

/**
 * Get events for Section B: Almost Plans
 * All friend activity, prioritized by:
 * 1. <2 weeks + I'm also interested (hot leads)
 * 2. <2 weeks + I'm not involved
 * 3. >2 weeks + I'm also interested  
 * 4. >2 weeks + I'm not involved
 * Within each tier: sorted by # mutual friends
 */
export async function getAlmostPlans(userId: string, filters?: SocialFilters): Promise<EventDisplay[]> {
  const now = new Date();
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  
  const friendIds = await getFriendIds(userId);

  if (friendIds.length === 0) return [];

  // Build date filter
  const dateFilter: { gte?: Date; lte?: Date } = { gte: filters?.startDate || now };
  if (filters?.endDate) {
    dateFilter.lte = filters.endDate;
  }

  // Get all events where friends have activity
  const events = await prisma.event.findMany({
    where: {
      startDateTime: dateFilter,
      // Apply venue filter
      ...(filters?.venueIds?.length ? { venueId: { in: filters.venueIds } } : {}),
      // Apply category filter (cast to EventCategory enum)
      ...(filters?.categories?.length ? { category: { in: filters.categories as EventCategory[] } } : {}),
      // At least one friend has marked status
      userEvents: {
        some: {
          userId: { in: friendIds },
          status: { in: [AttendanceStatus.INTERESTED, AttendanceStatus.GOING, AttendanceStatus.NEED_TICKETS, AttendanceStatus.HAVE_TICKETS] },
        },
      },
    },
    include: {
      venue: true,
      userEvents: {
        where: {
          OR: [
            { userId }, // User's status
            { userId: { in: friendIds } }, // Friend statuses
          ],
        },
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
      },
      squads: {
        where: {
          members: { some: { userId } }, // Check if user already has squad
        },
        include: {
          members: true, // Need this for processing
        },
      },
      enrichment: {
        select: {
          spotifyUrl: true,
          kgWikiUrl: true,
          spotifyGenres: true,
          tmUrl: true,
          tmPreferTitle: true,
          tmEventName: true,
        },
      },
    },
  });

  // Process and prioritize events
  const processedEvents = events.map(event => {
    const userEvent = event.userEvents.find(ue => ue.userId === userId);
    const friendEvents = event.userEvents.filter(ue => friendIds.includes(ue.userId));
    const hasUserSquad = event.squads.length > 0;
    
    // Skip if user already has squad for this event (should be in "Your Plans" instead)
    if (hasUserSquad) return null;
    
    // Keep track of user squad info even for almost plans
    const userSquad = event.squads.find(squad => 
      squad.members.some(member => member.userId === userId)
    );
    
    const userHasInterest = userEvent?.status === AttendanceStatus.INTERESTED || userEvent?.status === AttendanceStatus.GOING;
    const isWithin2Weeks = new Date(event.startDateTime) <= twoWeeksOut;
    const friendCount = friendEvents.length;
    
    // Priority calculation (lower = higher priority)
    let priority = 4; // Default: >2 weeks + no user interest
    if (isWithin2Weeks && userHasInterest) {
      priority = 1; // Hot lead
    } else if (isWithin2Weeks && !userHasInterest) {
      priority = 2;
    } else if (!isWithin2Weeks && userHasInterest) {
      priority = 3;
    }
    
    // Within each priority tier, sort by friend count (descending)
    const sortKey = (priority * 1000) - friendCount;
    
    return {
      ...event,
      displayTitle: getDisplayTitle(event),
      enrichment: event.enrichment ? mapEnrichmentForDisplay(event.enrichment) : undefined,
      social: {
        userStatus: userEvent?.status as 'GOING' | 'INTERESTED' || null,
        friendsGoing: friendEvents.filter(fe => fe.status === AttendanceStatus.GOING).length,
        friendsInterested: friendEvents.filter(fe => fe.status === AttendanceStatus.INTERESTED).length,
        communitiesGoing: [],
      },
      // Squad information for smart buttons
      userSquad: userSquad ? {
        id: userSquad.id,
        hasSquad: true,
      } : null,
      // Metadata for sorting and display
      _sortKey: sortKey,
      _userHasInterest: userHasInterest,
      _isWithin2Weeks: isWithin2Weeks,
      _friendCount: friendCount,
      friendsGoing: friendEvents.filter(fe => fe.status === AttendanceStatus.GOING).map(fe => ({
        userId: fe.user.id,
        displayName: fe.user.displayName,
        email: fe.user.email,
      })),
      friendsInterested: friendEvents.filter(fe => fe.status === AttendanceStatus.INTERESTED).map(fe => ({
        userId: fe.user.id,
        displayName: fe.user.displayName,
        email: fe.user.email,
      })),
    };
  }).filter((event): event is NonNullable<typeof event> => event !== null); // Remove null entries with type guard

  // Sort by priority and return top 20
  const sortedEvents = processedEvents.sort((a, b) => a._sortKey - b._sortKey);
  
  // Remove metadata
  return sortedEvents.slice(0, 20).map(({ _sortKey, _userHasInterest, _isWithin2Weeks, _friendCount, ...event }) => event);
}

/**
 * Get ticket activity for Section C
 * - Friends who Need Tickets or Have Tickets for upcoming events
 */
export async function getTicketActivity(userId: string) {
  const friendIds = await getFriendIds(userId);

  if (friendIds.length === 0) return [];

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 14); // Next 2 weeks

  const ticketActivity = await prisma.userEvent.findMany({
    where: {
      userId: { in: friendIds },
      status: { in: [AttendanceStatus.NEED_TICKETS, AttendanceStatus.HAVE_TICKETS] },
      event: {
        startDateTime: { gte: now, lte: cutoff },
      },
    },
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      event: {
        include: {
          venue: { select: { name: true } },
          enrichment: {
            select: {
              tmPreferTitle: true,
              tmEventName: true,
            },
          },
        },
      },
    },
    orderBy: { event: { startDateTime: 'asc' } },
    take: 20,
  });

  return ticketActivity.map(activity => ({
    eventId: activity.event.id,
    eventTitle: getDisplayTitle(activity.event),
    eventDate: activity.event.startDateTime,
    venueName: activity.event.venue.name,
    friendId: activity.user.id,
    friendName: activity.user.displayName || activity.user.email,
    status: activity.status as 'NEED_TICKETS' | 'HAVE_TICKETS',
  }));
}

/**
 * Helper: Compute display title following data model pattern
 */
function getDisplayTitle(event: any): string {
  return event.enrichment?.tmPreferTitle && event.enrichment?.tmEventName
    ? event.enrichment.tmEventName
    : event.title;
}

/**
 * Helper: Map enrichment to display format
 */
function mapEnrichmentForDisplay(enrichment: any): EnrichmentDisplay {
  return {
    spotifyUrl: enrichment.spotifyUrl,
    wikipediaUrl: enrichment.kgWikiUrl,
    genres: enrichment.spotifyGenres || [],
    tmUrl: enrichment.tmUrl,
  };
}
