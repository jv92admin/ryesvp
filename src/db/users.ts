import prisma from './prisma';
import { getFriendship, getFriendIds, getFriends } from './friends';
import { AttendanceStatus, FriendshipStatus, User } from '@prisma/client';

// ============================================
// Core User Functions (used by auth)
// ============================================

/**
 * Get a user by their Supabase Auth ID
 */
export async function getUserByAuthId(authProviderId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { authProviderId },
  });
}

/**
 * Create or update a user in the database
 */
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

// ============================================
// Profile Page Functions
// ============================================

/**
 * Friendship relationship from viewer's perspective
 */
export type FriendshipRelation = 
  | 'self'           // Viewing own profile
  | 'friend'         // Accepted friendship
  | 'pending_sent'   // Viewer sent request, awaiting response
  | 'pending_received' // Target sent request, viewer needs to respond
  | 'stranger';      // No relationship

export interface UserProfile {
  id: string;
  displayName: string | null;
  email: string;
  createdAt: Date;
  // Friendship context
  relation: FriendshipRelation;
  friendshipId: string | null;  // For accept/decline/remove actions
  friendsSince: Date | null;    // When friendship was accepted
  // Social context (friends only)
  mutualFriendCount: number;
  mutualFriends: { id: string; displayName: string | null }[];
  friendCount: number;
}

export interface UserEventForProfile {
  id: string;
  title: string;
  displayTitle: string;
  startDateTime: Date;
  imageUrl: string | null;
  venue: { id: string; name: string };
  status: 'GOING' | 'INTERESTED';
  isMutual: boolean;  // Viewer is also interested/going
}

/**
 * Get user profile with friendship context
 */
export async function getUserProfile(
  targetUserId: string,
  viewerId: string | null
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      displayName: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  // Determine relationship
  let relation: FriendshipRelation = 'stranger';
  let friendshipId: string | null = null;
  let friendsSince: Date | null = null;
  let mutualFriendCount = 0;
  let mutualFriends: { id: string; displayName: string | null }[] = [];
  let friendCount = 0;

  if (!viewerId) {
    // Logged out - treat as stranger (but they'll be redirected anyway)
    relation = 'stranger';
  } else if (viewerId === targetUserId) {
    relation = 'self';
  } else {
    const friendship = await getFriendship(viewerId, targetUserId);
    
    if (friendship) {
      friendshipId = friendship.id;
      
      if (friendship.status === FriendshipStatus.ACCEPTED) {
        relation = 'friend';
        friendsSince = friendship.updatedAt;
      } else if (friendship.status === FriendshipStatus.PENDING) {
        relation = friendship.requesterId === viewerId 
          ? 'pending_sent' 
          : 'pending_received';
      }
      // DECLINED and BLOCKED treated as stranger (can re-request)
    }
  }

  // Get social context for friends and self
  if (viewerId && (relation === 'friend' || relation === 'self')) {
    // Get friend count
    friendCount = await prisma.friendship.count({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: targetUserId },
          { addresseeId: targetUserId },
        ],
      },
    });

    // Get mutual friends (only for viewing others' profiles)
    if (relation === 'friend') {
      const [viewerFriendIds, targetFriendIds] = await Promise.all([
        getFriendIds(viewerId),
        getFriendIds(targetUserId),
      ]);

      const mutualIds = viewerFriendIds.filter(id => targetFriendIds.includes(id));
      mutualFriendCount = mutualIds.length;

      // Get first 5 mutual friends for display
      if (mutualIds.length > 0) {
        const mutuals = await prisma.user.findMany({
          where: { id: { in: mutualIds.slice(0, 5) } },
          select: { id: true, displayName: true },
        });
        mutualFriends = mutuals;
      }
    }
  }

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    createdAt: user.createdAt,
    relation,
    friendshipId,
    friendsSince,
    mutualFriendCount,
    mutualFriends,
    friendCount,
  };
}

/**
 * Get user's events for profile display (friends only)
 * Returns Going and Interested events, with mutual flag
 */
export async function getUserEventsForProfile(
  targetUserId: string,
  viewerId: string
): Promise<{ going: UserEventForProfile[]; interested: UserEventForProfile[] }> {
  const now = new Date();

  // Get target user's events
  const userEvents = await prisma.userEvent.findMany({
    where: {
      userId: targetUserId,
      status: { in: [AttendanceStatus.GOING, AttendanceStatus.INTERESTED] },
      event: { startDateTime: { gte: now } },
    },
    include: {
      event: {
        include: {
          venue: { select: { id: true, name: true } },
          enrichment: {
            select: { tmPreferTitle: true, tmEventName: true },
          },
        },
      },
    },
    orderBy: { event: { startDateTime: 'asc' } },
  });

  // Get viewer's event statuses to determine mutual
  const viewerEventIds = new Set(
    (await prisma.userEvent.findMany({
      where: {
        userId: viewerId,
        status: { in: [AttendanceStatus.GOING, AttendanceStatus.INTERESTED] },
        eventId: { in: userEvents.map(ue => ue.eventId) },
      },
      select: { eventId: true },
    })).map(ue => ue.eventId)
  );

  const mapEvent = (ue: typeof userEvents[0]): UserEventForProfile => ({
    id: ue.event.id,
    title: ue.event.title,
    displayTitle: ue.event.enrichment?.tmPreferTitle && ue.event.enrichment?.tmEventName
      ? ue.event.enrichment.tmEventName
      : ue.event.title,
    startDateTime: ue.event.startDateTime,
    imageUrl: ue.event.imageUrl,
    venue: ue.event.venue,
    status: ue.status as 'GOING' | 'INTERESTED',
    isMutual: viewerEventIds.has(ue.eventId),
  });

  return {
    going: userEvents
      .filter(ue => ue.status === AttendanceStatus.GOING)
      .map(mapEvent),
    interested: userEvents
      .filter(ue => ue.status === AttendanceStatus.INTERESTED)
      .map(mapEvent),
  };
}

/**
 * Get events where both users have interest (mutual events)
 * Highlighted section on friend profiles
 */
export async function getMutualEvents(
  userId1: string,
  userId2: string
): Promise<UserEventForProfile[]> {
  const now = new Date();

  // Find events where both users have Going or Interested status
  const user1Events = await prisma.userEvent.findMany({
    where: {
      userId: userId1,
      status: { in: [AttendanceStatus.GOING, AttendanceStatus.INTERESTED] },
      event: { startDateTime: { gte: now } },
    },
    select: { eventId: true, status: true },
  });

  const user1EventIds = user1Events.map(ue => ue.eventId);

  if (user1EventIds.length === 0) return [];

  const mutualUserEvents = await prisma.userEvent.findMany({
    where: {
      userId: userId2,
      eventId: { in: user1EventIds },
      status: { in: [AttendanceStatus.GOING, AttendanceStatus.INTERESTED] },
      event: { startDateTime: { gte: now } },
    },
    include: {
      event: {
        include: {
          venue: { select: { id: true, name: true } },
          enrichment: {
            select: { tmPreferTitle: true, tmEventName: true },
          },
        },
      },
    },
    orderBy: { event: { startDateTime: 'asc' } },
  });

  return mutualUserEvents.map(ue => ({
    id: ue.event.id,
    title: ue.event.title,
    displayTitle: ue.event.enrichment?.tmPreferTitle && ue.event.enrichment?.tmEventName
      ? ue.event.enrichment.tmEventName
      : ue.event.title,
    startDateTime: ue.event.startDateTime,
    imageUrl: ue.event.imageUrl,
    venue: ue.event.venue,
    status: ue.status as 'GOING' | 'INTERESTED',
    isMutual: true, // By definition
  }));
}

/**
 * Cancel a pending friend request (sent by viewer)
 */
export async function cancelFriendRequest(
  friendshipId: string,
  userId: string
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  if (friendship.requesterId !== userId) {
    throw new Error('Not authorized to cancel this request');
  }

  if (friendship.status !== FriendshipStatus.PENDING) {
    throw new Error('Request is not pending');
  }

  await prisma.friendship.delete({
    where: { id: friendshipId },
  });
}
