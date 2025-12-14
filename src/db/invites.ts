// Invite code management for referral links

import { prisma } from '@/db/prisma';
import { FriendshipStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { createNotification } from '@/db/notifications';

/**
 * Get or create an invite code for a user
 * Each user has exactly one invite code
 */
export async function getOrCreateInviteCode(userId: string) {
  // Try to find existing
  const existing = await prisma.inviteCode.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  // Create new code
  const code = nanoid(8); // 8 char code like "abc12def"
  
  return prisma.inviteCode.create({
    data: {
      code,
      userId,
    },
  });
}

/**
 * Validate an invite code and get inviter info
 * Returns null if invalid
 */
export async function validateInviteCode(code: string) {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
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

  if (!inviteCode) {
    return null;
  }

  return {
    valid: true,
    inviterId: inviteCode.user.id,
    inviterName: inviteCode.user.displayName || inviteCode.user.email.split('@')[0],
  };
}

/**
 * Redeem an invite code after a new user signs up
 * - Creates auto-accepted friendship
 * - Records the redemption
 * - Increments use count
 */
export async function redeemInviteCode(code: string, newUserId: string) {
  // Validate the code
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
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

  if (!inviteCode) {
    return { success: false, error: 'Invalid invite code' };
  }

  const inviterId = inviteCode.userId;

  // Can't invite yourself
  if (inviterId === newUserId) {
    return { success: false, error: 'Cannot use your own invite code' };
  }

  // Check if already redeemed by this user
  const existingRedemption = await prisma.inviteRedemption.findUnique({
    where: { newUserId },
  });

  if (existingRedemption) {
    return { success: false, error: 'User already has a referrer' };
  }

  // Check if already friends
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: inviterId, addresseeId: newUserId },
        { requesterId: newUserId, addresseeId: inviterId },
      ],
    },
  });

  // Use transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Create redemption record
    await tx.inviteRedemption.create({
      data: {
        inviteCodeId: inviteCode.id,
        newUserId,
      },
    });

    // Increment use count
    await tx.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } },
    });

    // Create friendship if not already friends
    if (!existingFriendship) {
      await tx.friendship.create({
        data: {
          requesterId: inviterId,
          addresseeId: newUserId,
          status: FriendshipStatus.ACCEPTED, // Auto-accepted via invite
        },
      });
    }
  });

  // Notify the inviter that someone joined via their link
  if (!existingFriendship) {
    // Get the new user's name for the notification
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { displayName: true, email: true },
    });
    const actorName = newUser?.displayName || newUser?.email?.split('@')[0] || 'Someone';
    
    await createNotification(inviterId, 'FRIEND_REQUEST_ACCEPTED', {
      actorId: newUserId,
      actorName,
      friendId: newUserId,
    });
  }

  return {
    success: true,
    friendshipCreated: !existingFriendship,
    inviterName: inviteCode.user.displayName || inviteCode.user.email.split('@')[0],
  };
}

/**
 * Get invite stats for a user
 */
export async function getInviteStats(userId: string) {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { userId },
    include: {
      redemptions: {
        include: {
          newUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!inviteCode) {
    return null;
  }

  return {
    code: inviteCode.code,
    usedCount: inviteCode.usedCount,
    createdAt: inviteCode.createdAt,
    referrals: inviteCode.redemptions.map((r) => ({
      id: r.newUser.id,
      name: r.newUser.displayName || r.newUser.email.split('@')[0],
      joinedAt: r.createdAt,
    })),
  };
}

/**
 * Get who referred a user (if anyone)
 */
export async function getReferrer(userId: string) {
  const redemption = await prisma.inviteRedemption.findUnique({
    where: { newUserId: userId },
    include: {
      inviteCode: {
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
  });

  if (!redemption) {
    return null;
  }

  const inviter = redemption.inviteCode.user;
  return {
    id: inviter.id,
    name: inviter.displayName || inviter.email.split('@')[0],
  };
}

