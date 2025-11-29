import prisma from './prisma';
import { UserEvent, AttendanceStatus, Event, Venue } from '@prisma/client';

export type UserEventWithEvent = UserEvent & {
  event: Event & {
    venue: Venue;
  };
};

export async function upsertUserEvent(data: {
  userId: string;
  eventId: string;
  status: AttendanceStatus;
  comment?: string | null;
}): Promise<UserEvent> {
  return prisma.userEvent.upsert({
    where: {
      userId_eventId: {
        userId: data.userId,
        eventId: data.eventId,
      },
    },
    update: {
      status: data.status,
      comment: data.comment || null,
    },
    create: {
      userId: data.userId,
      eventId: data.eventId,
      status: data.status,
      comment: data.comment || null,
    },
  });
}

export async function deleteUserEvent(userId: string, eventId: string): Promise<void> {
  await prisma.userEvent.delete({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });
}

export async function getUserEvents(userId: string): Promise<UserEventWithEvent[]> {
  return prisma.userEvent.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          venue: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserEventByEventId(
  userId: string,
  eventId: string
): Promise<UserEvent | null> {
  return prisma.userEvent.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });
}

export async function getEventAttendance(eventId: string): Promise<{
  going: number;
  interested: number;
  needTickets: number;
  haveTickets: number;
}> {
  const [going, interested, needTickets, haveTickets] = await Promise.all([
    prisma.userEvent.count({
      where: { eventId, status: 'GOING' },
    }),
    prisma.userEvent.count({
      where: { eventId, status: 'INTERESTED' },
    }),
    prisma.userEvent.count({
      where: { eventId, status: 'NEED_TICKETS' },
    }),
    prisma.userEvent.count({
      where: { eventId, status: 'HAVE_TICKETS' },
    }),
  ]);

  return { going, interested, needTickets, haveTickets };
}

/**
 * Get users with a specific attendance status for an event
 * Used for the tappable status lists
 */
export async function getEventAttendeesByStatus(
  eventId: string,
  status: AttendanceStatus
): Promise<{ userId: string; displayName: string | null; email: string }[]> {
  const userEvents = await prisma.userEvent.findMany({
    where: { eventId, status },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  return userEvents.map((ue) => ({
    userId: ue.user.id,
    displayName: ue.user.displayName,
    email: ue.user.email,
  }));
}

