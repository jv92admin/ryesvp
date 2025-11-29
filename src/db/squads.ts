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
  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: {
      event: { 
        include: { 
          venue: true,
          enrichment: {
            select: {
              tmEventName: true,
              tmPreferTitle: true,
            },
          },
        } 
      },
      members: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!squad) return null;

  // Compute canonical displayTitle 
  const displayTitle = squad.event.enrichment?.tmPreferTitle && squad.event.enrichment?.tmEventName
    ? squad.event.enrichment.tmEventName
    : squad.event.title;

  // Ensure buyingForIds is always an array (for backward compatibility)
  return {
    ...squad,
    event: {
      ...squad.event,
      displayTitle, // Add computed displayTitle
    },
    members: squad.members.map(member => ({
      ...member,
      buyingForIds: (member as any).buyingForIds || [],
    })),
  };
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
          event: { 
            include: { 
              venue: true,
              enrichment: {
                select: {
                  tmEventName: true,
                  tmPreferTitle: true,
                },
              },
            } 
          },
          members: { include: { user: true } },
        },
      },
    },
  });
  
  const squad = membership?.squad;
  if (!squad) return null;

  // Compute canonical displayTitle 
  const displayTitle = squad.event.enrichment?.tmPreferTitle && squad.event.enrichment?.tmEventName
    ? squad.event.enrichment.tmEventName
    : squad.event.title;

  // Ensure buyingForIds is always an array (for backward compatibility)
  return {
    ...squad,
    event: {
      ...squad.event,
      displayTitle, // Add computed displayTitle
    },
    members: squad.members.map(member => ({
      ...member,
      buyingForIds: (member as any).buyingForIds || [],
    })),
  };
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
    buyingForIds?: string[];
  }
) {
  // Only include defined values in the update
  const updateData: any = {};
  
  if (data.status !== undefined) updateData.status = data.status;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.ticketStatus !== undefined) updateData.ticketStatus = data.ticketStatus;
  if (data.buyingForCount !== undefined) updateData.buyingForCount = data.buyingForCount;
  if (data.buyingForIds !== undefined) updateData.buyingForIds = data.buyingForIds;


  return prisma.squadMember.update({
    where: {
      squadId_userId: { squadId, userId },
    },
    data: updateData,
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
 * Get all squads for a user (upcoming events only)
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

/**
 * Get squads with member counts for events (for Social Tab)
 */
export async function getEventSquadSummaries(eventIds: string[]) {
  if (eventIds.length === 0) return [];

  const squads = await prisma.squad.findMany({
    where: {
      eventId: { in: eventIds },
    },
    include: {
      members: {
        select: {
          status: true,
          userId: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  return squads.map(squad => ({
    eventId: squad.eventId,
    squadId: squad.id,
    memberCount: squad._count.members,
    statusCounts: {
      thinking: squad.members.filter(m => m.status === 'THINKING').length,
      in: squad.members.filter(m => m.status === 'IN').length,
      out: squad.members.filter(m => m.status === 'OUT').length,
    },
    memberIds: squad.members.map(m => m.userId),
  }));
}
