import prisma from './prisma';
import { SquadMemberStatus, SquadTicketStatus } from '@prisma/client';
import { getUserEventByEventId } from './userEvents';

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
  
  // Check creator's existing event attendance to inherit status
  const existingUserEvent = await getUserEventByEventId(data.createdById, data.eventId);
  
  const creatorStatus: SquadMemberStatus = existingUserEvent?.status === 'GOING' 
    ? 'IN' 
    : existingUserEvent?.status === 'INTERESTED' 
      ? 'THINKING'
      : 'IN'; // Default to IN for squad creators

  // Create squad with creator as organizer
  return prisma.squad.create({
    data: {
      eventId: data.eventId,
      createdById: data.createdById,
      members: {
        create: {
          userId: data.createdById,
          isOrganizer: true,
          status: creatorStatus,
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
        include: { 
          user: true,
          coveredBy: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
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
          members: { 
            include: { 
              user: true,
              coveredBy: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
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
    ticketStatus?: SquadTicketStatus;
    coveredById?: string | null;
    buyingForIds?: string[];
    guestCount?: number;
  }
) {
  // Only include defined values in the update
  const updateData: any = {};
  
  if (data.status !== undefined) updateData.status = data.status;
  if (data.ticketStatus !== undefined) updateData.ticketStatus = data.ticketStatus;
  if (data.coveredById !== undefined) updateData.coveredById = data.coveredById;
  if (data.buyingForIds !== undefined) updateData.buyingForIds = data.buyingForIds;
  if (data.guestCount !== undefined) updateData.guestCount = data.guestCount;

  return prisma.squadMember.update({
    where: {
      squadId_userId: { squadId, userId },
    },
    data: updateData,
  });
}

/**
 * Buy tickets for multiple squad members at once
 * Sets their ticketStatus to COVERED and links them to the buyer
 */
export async function buyForSquadMembers(
  squadId: string,
  buyerId: string,
  memberUserIds: string[]
) {
  if (memberUserIds.length === 0) return;

  // Update all target members to COVERED status
  await prisma.squadMember.updateMany({
    where: {
      squadId,
      userId: { in: memberUserIds },
    },
    data: {
      ticketStatus: 'COVERED',
      coveredById: buyerId,
    },
  });

  // Update buyer's buyingForIds
  const buyer = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId: buyerId } },
  });

  const existingBuyingFor = buyer?.buyingForIds || [];
  const newBuyingFor = [...new Set([...existingBuyingFor, ...memberUserIds])];

  await prisma.squadMember.update({
    where: { squadId_userId: { squadId, userId: buyerId } },
    data: {
      ticketStatus: 'YES', // Buyer must have ticket = YES
      buyingForIds: newBuyingFor,
    },
  });
}

/**
 * Remove coverage from a squad member (uncover them)
 * Clears their coveredById and reverts them to MAYBE status
 */
export async function uncoverSquadMember(
  squadId: string,
  memberId: string,
  buyerId: string
) {
  // Clear coverage on the member
  await prisma.squadMember.update({
    where: { squadId_userId: { squadId, userId: memberId } },
    data: {
      ticketStatus: 'MAYBE',
      coveredById: null,
    },
  });

  // Remove from buyer's buyingForIds
  const buyer = await prisma.squadMember.findUnique({
    where: { squadId_userId: { squadId, userId: buyerId } },
  });

  if (buyer) {
    const updatedBuyingFor = (buyer.buyingForIds || []).filter(id => id !== memberId);
    await prisma.squadMember.update({
      where: { squadId_userId: { squadId, userId: buyerId } },
      data: { buyingForIds: updatedBuyingFor },
    });
  }
}

/**
 * Get members who need tickets (MAYBE or NO status, not OUT, not already COVERED)
 */
export async function getMembersNeedingTickets(squadId: string) {
  return prisma.squadMember.findMany({
    where: {
      squadId,
      status: { not: 'OUT' },
      ticketStatus: { in: ['MAYBE', 'NO'] },
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

  // Check user's existing event attendance to inherit status
  const existingUserEvent = await getUserEventByEventId(userId, squad.eventId);
  
  const memberStatus: SquadMemberStatus = existingUserEvent?.status === 'GOING'
    ? 'IN'
    : existingUserEvent?.status === 'INTERESTED'
      ? 'THINKING'
      : 'THINKING'; // Default for new members
  
  return prisma.squadMember.create({
    data: {
      squadId,
      userId,
      status: memberStatus,
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
