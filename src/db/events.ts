import prisma from './prisma';
import { Event, Venue, EventCategory, EventStatus } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { getFriendIds } from './friends';
import { getListMemberIds, getAllListMemberIds } from './lists';
import { getCommunityMemberIds, getUserCommunities } from './communities';

const AUSTIN_TIMEZONE = 'America/Chicago';

export type EventWithVenue = Event & { venue: Venue };

// ============================================================================
// CANONICAL EVENT TYPE - Use this everywhere for display
// ============================================================================

/**
 * Enrichment data subset for UI display (not all 30+ fields)
 */
export type EnrichmentDisplay = {
  spotifyUrl: string | null;
  wikipediaUrl: string | null;
  genres: string[];
  tmUrl: string | null;
  // Presale data for discovery filter + badges
  tmOnSaleStart: Date | null;
  tmPresales: unknown; // JSON array of TMPresale objects
  tmStatus: string | null;
};

/**
 * Social signals for an event
 */
export type EventSocialSignals = {
  userStatus: 'GOING' | 'INTERESTED' | null;
  friendsGoing: number;
  friendsInterested: number;
  communitiesGoing: { communityId: string; communityName: string; count: number }[];
};

/**
 * THE canonical event type for all UI display.
 * 
 * DISCIPLINE: Always use this type when displaying events.
 * - displayTitle is ALWAYS computed at the data layer (never in components)
 * - enrichment/social are optional but always the same shape
 * 
 * DO NOT create alternative event types for sub-use-cases.
 */
export type EventDisplay = EventWithVenue & {
  displayTitle: string;              // ALWAYS resolved - use TM title if preferred, else event.title
  enrichment?: EnrichmentDisplay;
  social?: EventSocialSignals;
  userSquad?: {                      // User's squad for this event (if any)
    id: string;
    hasSquad: boolean;
  } | null;
};

// Legacy alias for backwards compatibility during migration
export type EventWithSocial = EventDisplay;

export interface GetEventsParams {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  categories?: EventCategory[]; // Multi-select categories
  venueId?: string;
  venueIds?: string[]; // Multi-select venues
  status?: EventStatus;
  limit?: number;
  offset?: number;
  myEvents?: boolean; // Filter to user's own events (GOING or INTERESTED)
  friendsGoing?: boolean;
  listId?: string; // Filter by list members going
  communityId?: string; // Filter by community members going
  userId?: string; // Required when myEvents, friendsGoing, listId, or communityId is set
}

export async function getEvents(params: GetEventsParams = {}): Promise<EventWithVenue[]> {
  const {
    startDate,
    endDate,
    category,
    categories,
    venueId,
    venueIds,
    status = 'SCHEDULED',
    limit = 1000,
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

  // Category filter (multi-select takes precedence)
  if (categories && categories.length > 0) {
    where.category = { in: categories };
  } else if (category) {
    where.category = category;
  }
  
  // Venue filter (multi-select takes precedence)
  if (venueIds && venueIds.length > 0) {
    where.venueId = { in: venueIds };
  } else if (venueId) {
    where.venueId = venueId;
  }
  
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

/**
 * Get a single event with displayTitle computed.
 * USE THIS for event detail pages and anywhere displaying a single event.
 */
export async function getEventDisplay(id: string): Promise<EventDisplay | null> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { venue: true },
  });
  
  if (!event) return null;
  
  // Get enrichment data
  const enrichment = await prisma.enrichment.findUnique({
    where: { eventId: id },
    select: {
      spotifyUrl: true,
      kgWikiUrl: true,
      spotifyGenres: true,
      tmEventName: true,
      tmPreferTitle: true,
      tmUrl: true,
    },
  });
  
  // Compute displayTitle ONCE here
  const displayTitle = enrichment?.tmPreferTitle && enrichment?.tmEventName
    ? enrichment.tmEventName
    : event.title;
  
  return {
    ...event,
    displayTitle,
    enrichment: enrichment ? {
      spotifyUrl: enrichment.spotifyUrl,
      wikipediaUrl: enrichment.kgWikiUrl,
      genres: enrichment.spotifyGenres?.slice(0, 2) || [],
      tmUrl: enrichment.tmUrl,
      tmOnSaleStart: null, // Not fetched in single event query
      tmPresales: null,
      tmStatus: null,
    } : undefined,
  };
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
// Converts dates to Central Time before grouping to ensure correct date headers
export function groupEventsByDate(events: EventWithVenue[]): Map<string, EventWithVenue[]> {
  const grouped = new Map<string, EventWithVenue[]>();
  
  for (const event of events) {
    // Convert to Central Time before extracting date components
    const centralTime = toZonedTime(event.startDateTime, AUSTIN_TIMEZONE);
    const year = centralTime.getFullYear();
    const month = String(centralTime.getMonth() + 1).padStart(2, '0');
    const day = String(centralTime.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in Central Time
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  }
  
  return grouped;
}

export async function getEventsWithAttendance(params: GetEventsParams = {}): Promise<EventWithVenue[]> {
  // No social filtering needed - use regular getEvents
  if (!params.myEvents && !params.friendsGoing && !params.listId && !params.communityId) {
    return getEvents(params);
  }
  
  if (!params.userId) {
    return getEvents(params);
  }
  
  // Build base where clause (same as getEvents)
  const baseWhere: Record<string, unknown> = {};
  
  if (params.startDate || params.endDate) {
    baseWhere.startDateTime = {};
    if (params.startDate) (baseWhere.startDateTime as Record<string, Date>).gte = params.startDate;
    if (params.endDate) (baseWhere.startDateTime as Record<string, Date>).lte = params.endDate;
  } else {
    baseWhere.startDateTime = { gte: new Date() };
  }
  
  // Category filter (multi-select takes precedence)
  if (params.categories && params.categories.length > 0) {
    baseWhere.category = { in: params.categories };
  } else if (params.category) {
    baseWhere.category = params.category;
  }
  
  // Venue filter (multi-select takes precedence)
  if (params.venueIds && params.venueIds.length > 0) {
    baseWhere.venueId = { in: params.venueIds };
  } else if (params.venueId) {
    baseWhere.venueId = params.venueId;
  }
  
  if (params.status) baseWhere.status = params.status;
  else baseWhere.status = 'SCHEDULED';
  
  // Special case: myEvents filters to user's own events directly at DB level
  if (params.myEvents) {
    return prisma.event.findMany({
      where: {
        ...baseWhere,
        userEvents: { 
          some: { 
            userId: params.userId,
            status: { in: ['GOING', 'INTERESTED'] }
          } 
        },
      },
      include: { venue: true },
      orderBy: { startDateTime: 'asc' },
      take: params.limit || 1000,
      skip: params.offset || 0,
    });
  }
  
  // Determine which user IDs to filter by
  let filterUserIds: string[] = [];
  
  if (params.communityId) {
    // Filter by community members
    try {
      filterUserIds = await getCommunityMemberIds(params.communityId, params.userId);
    } catch {
      // If community not found or not authorized, return empty
      return [];
    }
  } else if (params.listId === '__all_lists__') {
    // Filter by all list members across all user's lists
    filterUserIds = await getAllListMemberIds(params.userId);
  } else if (params.listId) {
    // Filter by specific list members
    try {
      filterUserIds = await getListMemberIds(params.listId, params.userId);
    } catch {
      // If list not found or not authorized, return empty
      return [];
    }
  } else if (params.friendsGoing) {
    // Filter by friends
    filterUserIds = await getFriendIds(params.userId);
  }
  
  if (filterUserIds.length === 0) {
    // No users to filter by, return empty array
    return [];
  }
  
  // Query events directly at DB level with attendance filter
  return prisma.event.findMany({
    where: {
      ...baseWhere,
      userEvents: { 
        some: { 
          userId: { in: filterUserIds },
          status: { in: ['GOING', 'INTERESTED'] }
        } 
      },
    },
    include: { venue: true },
    orderBy: { startDateTime: 'asc' },
    take: params.limit || 1000,
    skip: params.offset || 0,
  });
}

// Get social signals for a list of events (efficient batch query)
export async function getEventSocialSignals(
  eventIds: string[],
  userId: string
): Promise<Map<string, EventSocialSignals>> {
  const signalsMap = new Map<string, EventSocialSignals>();
  
  if (eventIds.length === 0) {
    return signalsMap;
  }
  
  // Initialize all events with empty signals
  for (const id of eventIds) {
    signalsMap.set(id, {
      userStatus: null,
      friendsGoing: 0,
      friendsInterested: 0,
      communitiesGoing: [],
    });
  }
  
  // Get user's own attendance status for these events
  const userAttendance = await prisma.userEvent.findMany({
    where: {
      eventId: { in: eventIds },
      userId: userId,
      status: { in: ['GOING', 'INTERESTED'] },
    },
    select: {
      eventId: true,
      status: true,
    },
  });
  
  for (const att of userAttendance) {
    const signals = signalsMap.get(att.eventId);
    if (signals) {
      signals.userStatus = att.status as 'GOING' | 'INTERESTED';
    }
  }
  
  // Get friend IDs
  const friendIds = await getFriendIds(userId);
  
  // Get user's communities
  const communities = await getUserCommunities(userId);
  
  // Query friends' attendance
  if (friendIds.length > 0) {
    const friendAttendance = await prisma.userEvent.findMany({
      where: {
        eventId: { in: eventIds },
        userId: { in: friendIds },
        status: { in: ['GOING', 'INTERESTED'] },
      },
      select: {
        eventId: true,
        status: true,
      },
    });
    
    for (const att of friendAttendance) {
      const signals = signalsMap.get(att.eventId);
      if (signals) {
        if (att.status === 'GOING') {
          signals.friendsGoing++;
        } else {
          signals.friendsInterested++;
        }
      }
    }
  }
  
  // Query community members' attendance (for each community)
  for (const community of communities) {
    // Get accepted members of this community (excluding self)
    const memberIds = await getCommunityMemberIds(community.id, userId);
    
    if (memberIds.length === 0) continue;
    
    const communityAttendance = await prisma.userEvent.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds },
        userId: { in: memberIds },
        status: 'GOING',
      },
      _count: {
        userId: true,
      },
    });
    
    for (const att of communityAttendance) {
      const signals = signalsMap.get(att.eventId);
      if (signals && att._count.userId > 0) {
        signals.communitiesGoing.push({
          communityId: community.id,
          communityName: community.name,
          count: att._count.userId,
        });
      }
    }
  }
  
  return signalsMap;
}

// Get events with social signals attached
export async function getEventsWithSocialSignals(
  params: GetEventsParams & { userId: string }
): Promise<EventDisplay[]> {
  const events = await getEventsWithAttendance(params);
  
  // Get enrichment data for all events (includes displayTitle computation data)
  const enrichmentMap = await getEnrichmentForDisplay(events.map(e => e.id));
  
  // Get social signals if user is logged in
  const signalsMap = params.userId 
    ? await getEventSocialSignals(events.map(e => e.id), params.userId)
    : new Map();
  
  // Get user's squads for these events if user is logged in
  const userSquads = params.userId ? await prisma.squad.findMany({
    where: {
      eventId: { in: events.map(e => e.id) },
      members: {
        some: { userId: params.userId },
      },
    },
    select: { id: true, eventId: true },
  }) : [];
  
  // Create squad map for quick lookup
  const squadMap = new Map(userSquads.map(squad => [squad.eventId, { id: squad.id, hasSquad: true }]));
  
  // Build EventDisplay objects with displayTitle computed ONCE here
  return events.map(event => {
    const enrichmentData = enrichmentMap.get(event.id);
    
    // CANONICAL displayTitle computation - happens only here
    const displayTitle = enrichmentData?.preferTMTitle && enrichmentData?.tmEventName
      ? enrichmentData.tmEventName
      : event.title;
    
    return {
      ...event,
      displayTitle,
      social: signalsMap.get(event.id),
      userSquad: squadMap.get(event.id) || null,
      enrichment: enrichmentData ? {
        spotifyUrl: enrichmentData.spotifyUrl,
        wikipediaUrl: enrichmentData.wikipediaUrl,
        genres: enrichmentData.genres,
        tmUrl: enrichmentData.tmUrl,
        tmOnSaleStart: enrichmentData.tmOnSaleStart,
        tmPresales: enrichmentData.tmPresales,
        tmStatus: enrichmentData.tmStatus,
      } : undefined,
    };
  });
}

// Internal type for enrichment fetch (includes title computation data)
type EnrichmentForDisplay = {
  spotifyUrl: string | null;
  wikipediaUrl: string | null;
  genres: string[];
  tmUrl: string | null;
  // For displayTitle computation
  tmEventName: string | null;
  preferTMTitle: boolean;
  // Presale data
  tmOnSaleStart: Date | null;
  tmPresales: unknown;
  tmStatus: string | null;
};

// Get enrichment data needed for display (internal use)
async function getEnrichmentForDisplay(eventIds: string[]): Promise<Map<string, EnrichmentForDisplay>> {
  const map = new Map<string, EnrichmentForDisplay>();
  
  if (eventIds.length === 0) return map;
  
  const enrichments = await prisma.enrichment.findMany({
    where: {
      eventId: { in: eventIds },
      status: { in: ['COMPLETED', 'PARTIAL'] },
    },
    select: {
      eventId: true,
      spotifyUrl: true,
      kgWikiUrl: true,
      spotifyGenres: true,
      tmEventName: true,
      tmPreferTitle: true,
      tmUrl: true,
      tmOnSaleStart: true,
      tmPresales: true,
      tmStatus: true,
    },
  });
  
  for (const e of enrichments) {
    map.set(e.eventId, {
      spotifyUrl: e.spotifyUrl,
      wikipediaUrl: e.kgWikiUrl,
      genres: e.spotifyGenres?.slice(0, 2) || [],
      tmUrl: e.tmUrl,
      tmEventName: e.tmEventName,
      preferTMTitle: e.tmPreferTitle,
      tmOnSaleStart: e.tmOnSaleStart,
      tmPresales: e.tmPresales,
      tmStatus: e.tmStatus,
    });
  }
  
  return map;
}

// Detailed attendee info for event page
export type EventAttendee = {
  id: string;
  displayName: string | null;
  email: string;
  status: 'GOING' | 'INTERESTED';
};

export type EventDetailedSocial = {
  friends: EventAttendee[];
  communities: {
    communityId: string;
    communityName: string;
    attendees: EventAttendee[];
  }[];
};

// Get detailed social info for a single event (for event detail page)
export async function getEventDetailedSocial(
  eventId: string,
  userId: string
): Promise<EventDetailedSocial> {
  const result: EventDetailedSocial = {
    friends: [],
    communities: [],
  };
  
  // Get friend IDs
  const friendIds = await getFriendIds(userId);
  
  // Get friends' attendance with user details
  if (friendIds.length > 0) {
    const friendAttendance = await prisma.userEvent.findMany({
      where: {
        eventId,
        userId: { in: friendIds },
        status: { in: ['GOING', 'INTERESTED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        status: 'asc', // GOING first
      },
    });
    
    result.friends = friendAttendance.map(a => ({
      id: a.user.id,
      displayName: a.user.displayName,
      email: a.user.email,
      status: a.status as 'GOING' | 'INTERESTED',
    }));
  }
  
  // Get user's communities
  const communities = await getUserCommunities(userId);
  
  // For each community, get members who are attending
  for (const community of communities) {
    const memberIds = await getCommunityMemberIds(community.id, userId);
    
    if (memberIds.length === 0) continue;
    
    // Filter out friends (they're already shown in friends section)
    const nonFriendMemberIds = memberIds.filter(id => !friendIds.includes(id));
    
    if (nonFriendMemberIds.length === 0) continue;
    
    const communityAttendance = await prisma.userEvent.findMany({
      where: {
        eventId,
        userId: { in: nonFriendMemberIds },
        status: { in: ['GOING', 'INTERESTED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        status: 'asc',
      },
    });
    
    if (communityAttendance.length > 0) {
      result.communities.push({
        communityId: community.id,
        communityName: community.name,
        attendees: communityAttendance.map(a => ({
          id: a.user.id,
          displayName: a.user.displayName,
          email: a.user.email,
          status: a.status as 'GOING' | 'INTERESTED',
        })),
      });
    }
  }
  
  return result;
}

