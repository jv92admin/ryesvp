import prisma from './prisma';
import { NotificationType, Notification } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationPayload = {
  // Actor info (who triggered the notification)
  actorId?: string;
  actorName?: string;
  
  // Friend info (for friend-related notifications)
  friendId?: string;
  
  // Event info
  eventId?: string;
  eventTitle?: string;
  eventDate?: string; // ISO string for display
  
  // Squad/Plan info
  squadId?: string;
  
  // Group link info
  groupId?: string;
  groupName?: string;
  newFriendCount?: number;
  
  // Additional context
  message?: string;
};

export type NotificationWithDetails = Notification & {
  // Computed fields for display
  displayText: string;
  linkUrl: string | null;
};

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

function getNotificationText(type: NotificationType, payload: NotificationPayload): string {
  const actor = payload.actorName || 'Someone';
  const event = payload.eventTitle || 'an event';
  const eventDate = payload.eventDate ? ` on ${payload.eventDate}` : '';
  const groupName = payload.groupName || 'a group';
  
  switch (type) {
    case 'FRIEND_REQUEST_RECEIVED':
      return `${actor} sent you a friend request.`;
    case 'FRIEND_REQUEST_ACCEPTED':
      return `${actor} accepted your friend request.`;
    case 'ADDED_TO_PLAN':
      return `${actor} added you to their plan for ${event}${eventDate}.`;
    case 'PLAN_CANCELLED':
      return `Your plan for ${event}${eventDate} was cancelled.`;
    case 'PLAN_MEMBER_JOINED':
      return `${actor} joined your plan for ${event}.`;
    case 'PLAN_MEMBER_LEFT':
      return `${actor} left your plan for ${event}.`;
    case 'TICKET_COVERED_FOR_YOU':
      return `${actor} is handling your ticket for ${event}${eventDate}.`;
    case 'PLAN_MEETUP_CREATED':
      return `Meetup added for your ${event} plan: ${payload.message || 'Check the plan for details'}.`;
    case 'GROUP_MEMBER_JOINED':
      return `${actor} joined ${groupName}.`;
    default:
      return 'You have a new notification.';
  }
}

function getNotificationLink(type: NotificationType, payload: NotificationPayload): string | null {
  switch (type) {
    case 'FRIEND_REQUEST_RECEIVED':
    case 'FRIEND_REQUEST_ACCEPTED':
      // Link to the friend's profile if we have their ID
      return payload.friendId ? `/users/${payload.friendId}` : '/friends';
    case 'ADDED_TO_PLAN':
    case 'PLAN_MEMBER_JOINED':
    case 'PLAN_MEMBER_LEFT':
    case 'TICKET_COVERED_FOR_YOU':
    case 'PLAN_MEETUP_CREATED':
      return payload.eventId
        ? `/events/${payload.eventId}?tab=plan`
        : payload.squadId
          ? `/squads/${payload.squadId}`
          : null;
    case 'PLAN_CANCELLED':
      // Plan is gone, link to event instead
      return payload.eventId ? `/events/${payload.eventId}` : null;
    case 'GROUP_MEMBER_JOINED':
      // Link to the new member's profile
      return payload.actorId ? `/users/${payload.actorId}` : '/friends';
    default:
      return null;
  }
}

// ============================================================================
// CREATE NOTIFICATIONS
// ============================================================================

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      recipientId,
      type,
      payload: payload as object,
    },
  });
}

export async function createNotifications(
  recipientIds: string[],
  type: NotificationType,
  payload: NotificationPayload
): Promise<{ count: number }> {
  if (recipientIds.length === 0) return { count: 0 };
  
  return prisma.notification.createMany({
    data: recipientIds.map(recipientId => ({
      recipientId,
      type,
      payload: payload as object,
    })),
  });
}

// ============================================================================
// READ NOTIFICATIONS
// ============================================================================

export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<NotificationWithDetails[]> {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  return notifications.map(n => ({
    ...n,
    displayText: getNotificationText(n.type, n.payload as NotificationPayload),
    linkUrl: getNotificationLink(n.type, n.payload as NotificationPayload),
  }));
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      readAt: null,
    },
  });
}

// ============================================================================
// UPDATE NOTIFICATIONS
// ============================================================================

export async function markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
  // Only mark if it belongs to the user
  return prisma.notification.update({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  return prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Keep only the last N notifications per user, delete older ones.
 * Should be called periodically (e.g., after creating notifications).
 */
export async function cleanupOldNotifications(userId: string, keepCount: number = 100): Promise<{ count: number }> {
  // Get the Nth oldest notification's createdAt
  const nthNotification = await prisma.notification.findFirst({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    skip: keepCount - 1,
    select: { createdAt: true },
  });
  
  if (!nthNotification) {
    // User has fewer than keepCount notifications, nothing to delete
    return { count: 0 };
  }
  
  // Delete all notifications older than the Nth one
  return prisma.notification.deleteMany({
    where: {
      recipientId: userId,
      createdAt: { lt: nthNotification.createdAt },
    },
  });
}

