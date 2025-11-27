import prisma from './prisma';
import { List, ListMember, ListMemberStatus, ListRole, User } from '@prisma/client';
import { areFriends } from './friends';

// Types
export type CommunityWithMembers = List & {
  members: (ListMember & { user: User; invitedBy: User | null })[];
  owner: User;
  _count: { members: number };
};

export type CommunityWithCount = List & {
  _count: { members: number };
  owner: User;
};

export type CommunityMembership = ListMember & {
  list: List & { owner: User };
};

// Get all communities the user is a member of (or owns)
export async function getUserCommunities(userId: string): Promise<CommunityWithCount[]> {
  return prisma.list.findMany({
    where: {
      isPublic: true,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              status: ListMemberStatus.ACTIVE,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      _count: {
        select: { members: { where: { status: ListMemberStatus.ACTIVE } } },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get pending community invitations for a user
export async function getPendingInvitations(userId: string): Promise<CommunityMembership[]> {
  return prisma.listMember.findMany({
    where: {
      userId,
      status: ListMemberStatus.PENDING,
      list: {
        isPublic: true,
      },
    },
    include: {
      list: {
        include: {
          owner: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
}

// Get a single community with members
export async function getCommunityById(communityId: string): Promise<CommunityWithMembers | null> {
  return prisma.list.findFirst({
    where: {
      id: communityId,
      isPublic: true,
    },
    include: {
      owner: true,
      members: {
        where: {
          status: ListMemberStatus.ACTIVE,
        },
        include: {
          user: true,
          invitedBy: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      },
      _count: {
        select: { members: { where: { status: ListMemberStatus.ACTIVE } } },
      },
    },
  });
}

// Create a new community
export async function createCommunity(data: {
  name: string;
  description?: string;
  ownerId: string;
}): Promise<List> {
  return prisma.list.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      isPublic: true, // Communities are public
    },
  });
}

// Invite a friend to a community
export async function inviteToCommunity(
  communityId: string,
  inviterId: string,
  inviteeId: string
): Promise<ListMember> {
  // Verify community exists and is public
  const community = await prisma.list.findFirst({
    where: {
      id: communityId,
      isPublic: true,
    },
    include: {
      members: {
        where: {
          userId: inviterId,
          status: ListMemberStatus.ACTIVE,
        },
      },
    },
  });

  if (!community) {
    throw new Error('Community not found');
  }

  // Check inviter is a member or owner
  const isOwner = community.ownerId === inviterId;
  const isMember = community.members.length > 0;

  if (!isOwner && !isMember) {
    throw new Error('You must be a member to invite others');
  }

  // Check inviter and invitee are friends (spam prevention)
  const friends = await areFriends(inviterId, inviteeId);
  if (!friends) {
    throw new Error('You can only invite friends to communities');
  }

  // Check if already invited or member
  const existing = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId: inviteeId,
      },
    },
  });

  if (existing) {
    if (existing.status === ListMemberStatus.ACTIVE) {
      throw new Error('User is already a member');
    }
    if (existing.status === ListMemberStatus.PENDING) {
      throw new Error('Invitation already pending');
    }
    // If declined or left, update to pending
    return prisma.listMember.update({
      where: { id: existing.id },
      data: {
        status: ListMemberStatus.PENDING,
        invitedById: inviterId,
        joinedAt: new Date(),
      },
    });
  }

  return prisma.listMember.create({
    data: {
      listId: communityId,
      userId: inviteeId,
      status: ListMemberStatus.PENDING,
      role: ListRole.MEMBER,
      invitedById: inviterId,
    },
  });
}

// Accept a community invitation
export async function acceptInvitation(
  communityId: string,
  userId: string
): Promise<ListMember> {
  const membership = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('Invitation not found');
  }

  if (membership.status !== ListMemberStatus.PENDING) {
    throw new Error('No pending invitation');
  }

  return prisma.listMember.update({
    where: { id: membership.id },
    data: {
      status: ListMemberStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });
}

// Decline a community invitation
export async function declineInvitation(
  communityId: string,
  userId: string
): Promise<ListMember> {
  const membership = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('Invitation not found');
  }

  if (membership.status !== ListMemberStatus.PENDING) {
    throw new Error('No pending invitation');
  }

  return prisma.listMember.update({
    where: { id: membership.id },
    data: {
      status: ListMemberStatus.DECLINED,
    },
  });
}

// Leave a community
export async function leaveCommunity(
  communityId: string,
  userId: string
): Promise<void> {
  const community = await prisma.list.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new Error('Community not found');
  }

  // Owner cannot leave (must delete or transfer ownership)
  if (community.ownerId === userId) {
    throw new Error('Owner cannot leave. Delete the community instead.');
  }

  await prisma.listMember.delete({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });
}

// Toggle visibility in a community
export async function toggleVisibility(
  communityId: string,
  userId: string,
  isVisible: boolean
): Promise<ListMember> {
  const membership = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('Not a member of this community');
  }

  return prisma.listMember.update({
    where: { id: membership.id },
    data: { isVisible },
  });
}

// Delete a community (owner only)
export async function deleteCommunity(
  communityId: string,
  userId: string
): Promise<void> {
  const community = await prisma.list.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new Error('Community not found');
  }

  if (community.ownerId !== userId) {
    throw new Error('Only the owner can delete this community');
  }

  await prisma.list.delete({
    where: { id: communityId },
  });
}

// Get community member IDs (for filtering events)
export async function getCommunityMemberIds(
  communityId: string,
  userId: string,
  visibleOnly: boolean = false
): Promise<string[]> {
  // Verify user is a member
  const membership = await prisma.listMember.findFirst({
    where: {
      listId: communityId,
      userId,
      status: ListMemberStatus.ACTIVE,
    },
  });

  const community = await prisma.list.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new Error('Community not found');
  }

  // Allow owner or active member
  if (community.ownerId !== userId && !membership) {
    throw new Error('Not a member of this community');
  }

  const members = await prisma.listMember.findMany({
    where: {
      listId: communityId,
      status: ListMemberStatus.ACTIVE,
      ...(visibleOnly ? { isVisible: true } : {}),
    },
    select: {
      userId: true,
    },
  });

  return members.map((m) => m.userId);
}

// Get user's membership in a community
export async function getUserMembership(
  communityId: string,
  userId: string
): Promise<ListMember | null> {
  return prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });
}

// Get pending invitation count
export async function getPendingInvitationCount(userId: string): Promise<number> {
  return prisma.listMember.count({
    where: {
      userId,
      status: ListMemberStatus.PENDING,
      list: {
        isPublic: true,
      },
    },
  });
}

// Get friends who can be invited to a community
export async function getInvitableFriends(
  communityId: string,
  userId: string
): Promise<User[]> {
  // Get current members and pending invites
  const existingMembers = await prisma.listMember.findMany({
    where: {
      listId: communityId,
      status: { in: [ListMemberStatus.ACTIVE, ListMemberStatus.PENDING] },
    },
    select: { userId: true },
  });
  const existingIds = existingMembers.map((m) => m.userId);

  // Get user's friends
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    include: {
      requester: true,
      addressee: true,
    },
  });

  const friends: User[] = [];
  for (const f of friendships) {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    if (!existingIds.includes(friend.id)) {
      friends.push(friend);
    }
  }

  return friends;
}

// Get events where community members are going/interested
// Respects visibility: if user is hidden, only counts are returned
export async function getCommunityEvents(
  communityId: string,
  userId: string
): Promise<{
  events: Array<{
    id: string;
    title: string;
    startDateTime: Date;
    venue: { name: string };
    goingCount: number;
    interestedCount: number;
    // Only populated if user is visible (reciprocity)
    visibleAttendees: Array<{
      user: { id: string; displayName: string | null; email: string };
      status: string;
    }>;
  }>;
  stats: { going: number; interested: number; totalEvents: number };
  userIsVisible: boolean;
}> {
  // Check user's visibility in this community
  const userMembership = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId: communityId,
        userId,
      },
    },
  });
  
  const community = await prisma.list.findUnique({
    where: { id: communityId },
  });
  
  if (!community) {
    throw new Error('Community not found');
  }
  
  // Owner is always visible
  const isOwner = community.ownerId === userId;
  const userIsVisible = isOwner || (userMembership?.isVisible ?? true);

  // Get all member IDs (including owner)
  const allMembers = await prisma.listMember.findMany({
    where: {
      listId: communityId,
      status: ListMemberStatus.ACTIVE,
    },
    select: { userId: true, isVisible: true },
  });
  
  const memberIds = [community.ownerId, ...allMembers.map((m) => m.userId)];
  
  // Get visible member IDs (for showing names - owner is always visible)
  const visibleMemberIds = [
    community.ownerId,
    ...allMembers.filter((m) => m.isVisible).map((m) => m.userId),
  ];

  // Get upcoming events where members are going/interested
  const events = await prisma.event.findMany({
    where: {
      startDateTime: { gte: new Date() },
      status: 'SCHEDULED',
      userEvents: {
        some: {
          userId: { in: memberIds },
          status: { in: ['GOING', 'INTERESTED'] },
        },
      },
    },
    include: {
      venue: true,
      userEvents: {
        where: {
          userId: { in: memberIds },
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
      },
    },
    orderBy: { startDateTime: 'asc' },
    take: 20,
  });

  // Calculate stats
  let totalGoing = 0;
  let totalInterested = 0;
  
  const mappedEvents = events.map((e) => {
    const goingCount = e.userEvents.filter((ue) => ue.status === 'GOING').length;
    const interestedCount = e.userEvents.filter((ue) => ue.status === 'INTERESTED').length;
    
    totalGoing += goingCount;
    totalInterested += interestedCount;
    
    // Only show visible attendees if user is visible (reciprocity)
    const visibleAttendees = userIsVisible
      ? e.userEvents
          .filter((ue) => visibleMemberIds.includes(ue.userId))
          .map((ue) => ({
            user: ue.user,
            status: ue.status,
          }))
      : [];
    
    return {
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      venue: { name: e.venue.name },
      goingCount,
      interestedCount,
      visibleAttendees,
    };
  });

  return {
    events: mappedEvents,
    stats: {
      going: totalGoing,
      interested: totalInterested,
      totalEvents: events.length,
    },
    userIsVisible,
  };
}

// Get event stats for a community (for card display)
export async function getCommunityEventStats(
  communityId: string
): Promise<{ upcomingEvents: number; membersGoing: number }> {
  // Get member IDs including owner
  const community = await prisma.list.findUnique({
    where: { id: communityId },
    include: {
      members: {
        where: { status: ListMemberStatus.ACTIVE },
        select: { userId: true },
      },
    },
  });

  if (!community) {
    return { upcomingEvents: 0, membersGoing: 0 };
  }

  const memberIds = [community.ownerId, ...community.members.map((m) => m.userId)];

  // Count upcoming events with members going
  const eventCount = await prisma.event.count({
    where: {
      startDateTime: { gte: new Date() },
      status: 'SCHEDULED',
      userEvents: {
        some: {
          userId: { in: memberIds },
          status: 'GOING',
        },
      },
    },
  });

  // Count total "going" responses from members
  const goingCount = await prisma.userEvent.count({
    where: {
      userId: { in: memberIds },
      status: 'GOING',
      event: {
        startDateTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
    },
  });

  return {
    upcomingEvents: eventCount,
    membersGoing: goingCount,
  };
}

