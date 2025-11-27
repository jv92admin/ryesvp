import prisma from './prisma';
import { Event, Venue, EventCategory, EventStatus } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { getFriendIds } from './friends';

const AUSTIN_TIMEZONE = 'America/Chicago';

export type EventWithVenue = Event & { venue: Venue };

export interface GetEventsParams {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  venueId?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
  friendsGoing?: boolean;
  userId?: string; // Required when friendsGoing is true
}

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
  const events = await getEvents(params);
  
  if (!params.friendsGoing || !params.userId) {
    return events;
  }
  
  // Get user's friend IDs
  const friendIds = await getFriendIds(params.userId);
  
  if (friendIds.length === 0) {
    // No friends, return empty array for "friends going" filter
    return [];
  }
  
  // Filter to only events where at least one friend has GOING or INTERESTED status
  const eventsWithFriendsGoing = await prisma.event.findMany({
    where: {
      id: { in: events.map(e => e.id) },
      userEvents: { 
        some: { 
          userId: { in: friendIds },
          status: { in: ['GOING', 'INTERESTED'] }
        } 
      },
    },
    include: { venue: true },
    orderBy: { startDateTime: 'asc' },
  });
  
  return eventsWithFriendsGoing;
}

