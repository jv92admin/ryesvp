import prisma from './prisma';
import { List, ListMember, ListMemberStatus, ListRole, User } from '@prisma/client';
import { areFriends } from './friends';

// Types
export type ListWithMembers = List & {
  members: (ListMember & { user: User })[];
  owner: User;
};

export type ListWithMemberCount = List & {
  _count: { members: number };
};

// Get all private lists owned by a user
export async function getPrivateLists(userId: string): Promise<ListWithMemberCount[]> {
  return prisma.list.findMany({
    where: {
      ownerId: userId,
      isPublic: false,
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get a single list with members
export async function getListById(listId: string): Promise<ListWithMembers | null> {
  return prisma.list.findUnique({
    where: { id: listId },
    include: {
      owner: true,
      members: {
        where: {
          status: ListMemberStatus.ACTIVE,
        },
        include: {
          user: true,
        },
      },
    },
  });
}

// Create a new private list
export async function createList(data: {
  name: string;
  description?: string;
  ownerId: string;
}): Promise<List> {
  return prisma.list.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
      isPublic: false, // Private lists only for now
    },
  });
}

// Update a list
export async function updateList(
  listId: string,
  userId: string,
  data: { name?: string; description?: string }
): Promise<List> {
  // Verify ownership
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw new Error('List not found');
  }

  if (list.ownerId !== userId) {
    throw new Error('Not authorized to update this list');
  }

  return prisma.list.update({
    where: { id: listId },
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

// Delete a list
export async function deleteList(listId: string, userId: string): Promise<void> {
  // Verify ownership
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw new Error('List not found');
  }

  if (list.ownerId !== userId) {
    throw new Error('Not authorized to delete this list');
  }

  await prisma.list.delete({
    where: { id: listId },
  });
}

// Add a friend to a private list
export async function addMemberToList(
  listId: string,
  userId: string,
  friendId: string
): Promise<ListMember> {
  // Verify list ownership
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw new Error('List not found');
  }

  if (list.ownerId !== userId) {
    throw new Error('Not authorized to modify this list');
  }

  // For private lists, verify they are friends
  if (!list.isPublic) {
    const friends = await areFriends(userId, friendId);
    if (!friends) {
      throw new Error('Can only add friends to private lists');
    }
  }

  // Check if already a member
  const existing = await prisma.listMember.findUnique({
    where: {
      listId_userId: {
        listId,
        userId: friendId,
      },
    },
  });

  if (existing) {
    throw new Error('User is already in this list');
  }

  return prisma.listMember.create({
    data: {
      listId,
      userId: friendId,
      status: ListMemberStatus.ACTIVE, // Private lists are immediately active
      role: ListRole.MEMBER,
    },
  });
}

// Remove a member from a list
export async function removeMemberFromList(
  listId: string,
  userId: string,
  memberId: string
): Promise<void> {
  // Verify list ownership
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw new Error('List not found');
  }

  if (list.ownerId !== userId) {
    throw new Error('Not authorized to modify this list');
  }

  await prisma.listMember.delete({
    where: {
      listId_userId: {
        listId,
        userId: memberId,
      },
    },
  });
}

// Get list member IDs (for filtering events)
export async function getListMemberIds(listId: string, userId: string): Promise<string[]> {
  // Verify list access
  const list = await prisma.list.findUnique({
    where: { id: listId },
  });

  if (!list) {
    throw new Error('List not found');
  }

  if (list.ownerId !== userId) {
    throw new Error('Not authorized to access this list');
  }

  const members = await prisma.listMember.findMany({
    where: {
      listId,
      status: ListMemberStatus.ACTIVE,
    },
    select: {
      userId: true,
    },
  });

  return members.map((m) => m.userId);
}

// Get friends not in a specific list (for adding to list)
export async function getFriendsNotInList(
  listId: string,
  userId: string
): Promise<User[]> {
  // Get current list members
  const listMembers = await prisma.listMember.findMany({
    where: { listId },
    select: { userId: true },
  });
  const memberIds = listMembers.map((m) => m.userId);

  // Get user's friends who are not in the list
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
    if (!memberIds.includes(friend.id)) {
      friends.push(friend);
    }
  }

  return friends;
}

// Get list count for a user
export async function getListCount(userId: string): Promise<number> {
  return prisma.list.count({
    where: {
      ownerId: userId,
      isPublic: false,
    },
  });
}

// Get all member IDs across all user's private lists
export async function getAllListMemberIds(userId: string): Promise<string[]> {
  const lists = await prisma.list.findMany({
    where: {
      ownerId: userId,
      isPublic: false,
    },
    include: {
      members: {
        where: {
          status: ListMemberStatus.ACTIVE,
        },
        select: {
          userId: true,
        },
      },
    },
  });

  // Collect unique member IDs across all lists
  const memberIds = new Set<string>();
  for (const list of lists) {
    for (const member of list.members) {
      memberIds.add(member.userId);
    }
  }

  return Array.from(memberIds);
}

