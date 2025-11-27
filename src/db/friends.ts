import prisma from './prisma';
import { Friendship, FriendshipStatus, User } from '@prisma/client';

// Types
export type FriendWithUser = Friendship & {
  requester: User;
  addressee: User;
};

export type FriendInfo = {
  friendship: Friendship;
  friend: User;
};

// Get all accepted friends for a user
export async function getFriends(userId: string): Promise<FriendInfo[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
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

  return friendships.map((f) => ({
    friendship: f,
    friend: f.requesterId === userId ? f.addressee : f.requester,
  }));
}

// Get friend IDs only (for filtering)
export async function getFriendIds(userId: string): Promise<string[]> {
  const friends = await getFriends(userId);
  return friends.map((f) => f.friend.id);
}

// Get pending friend requests received by user
export async function getPendingRequests(userId: string): Promise<FriendWithUser[]> {
  return prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: FriendshipStatus.PENDING,
    },
    include: {
      requester: true,
      addressee: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get pending friend requests sent by user
export async function getSentRequests(userId: string): Promise<FriendWithUser[]> {
  return prisma.friendship.findMany({
    where: {
      requesterId: userId,
      status: FriendshipStatus.PENDING,
    },
    include: {
      requester: true,
      addressee: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Send a friend request
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<Friendship> {
  // Check if friendship already exists in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === FriendshipStatus.ACCEPTED) {
      throw new Error('Already friends');
    }
    if (existing.status === FriendshipStatus.PENDING) {
      throw new Error('Friend request already pending');
    }
    if (existing.status === FriendshipStatus.BLOCKED) {
      throw new Error('Cannot send friend request');
    }
    // If declined, allow re-request by updating the existing record
    if (existing.status === FriendshipStatus.DECLINED) {
      return prisma.friendship.update({
        where: { id: existing.id },
        data: {
          requesterId,
          addresseeId,
          status: FriendshipStatus.PENDING,
          updatedAt: new Date(),
        },
      });
    }
  }

  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    },
  });
}

// Accept a friend request
export async function acceptFriendRequest(
  friendshipId: string,
  userId: string
): Promise<Friendship> {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  if (friendship.addresseeId !== userId) {
    throw new Error('Not authorized to accept this request');
  }

  if (friendship.status !== FriendshipStatus.PENDING) {
    throw new Error('Request is not pending');
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: FriendshipStatus.ACCEPTED },
  });
}

// Decline a friend request
export async function declineFriendRequest(
  friendshipId: string,
  userId: string
): Promise<Friendship> {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  if (friendship.addresseeId !== userId) {
    throw new Error('Not authorized to decline this request');
  }

  if (friendship.status !== FriendshipStatus.PENDING) {
    throw new Error('Request is not pending');
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: FriendshipStatus.DECLINED },
  });
}

// Remove a friend (unfriend)
export async function removeFriend(
  friendshipId: string,
  userId: string
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  // Either party can remove the friendship
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    throw new Error('Not authorized to remove this friendship');
  }

  await prisma.friendship.delete({
    where: { id: friendshipId },
  });
}

// Check if two users are friends
export async function areFriends(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [
        { requesterId: userId1, addresseeId: userId2 },
        { requesterId: userId2, addresseeId: userId1 },
      ],
    },
  });

  return !!friendship;
}

// Get friendship between two users (any status)
export async function getFriendship(
  userId1: string,
  userId2: string
): Promise<Friendship | null> {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId1, addresseeId: userId2 },
        { requesterId: userId2, addresseeId: userId1 },
      ],
    },
  });
}

// Search users by exact email (for adding friends)
// Requires exact email match to prevent browsing all users
export async function searchUsersByEmail(
  query: string,
  excludeUserId: string
): Promise<User[]> {
  // Require exact email match for privacy
  const user = await prisma.user.findUnique({
    where: {
      email: query.toLowerCase().trim(),
    },
  });

  // Don't return the searching user themselves
  if (!user || user.id === excludeUserId) {
    return [];
  }

  return [user];
}

// Get friend count
export async function getFriendCount(userId: string): Promise<number> {
  return prisma.friendship.count({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
  });
}

// Get pending request count (for notifications)
export async function getPendingRequestCount(userId: string): Promise<number> {
  return prisma.friendship.count({
    where: {
      addresseeId: userId,
      status: FriendshipStatus.PENDING,
    },
  });
}

