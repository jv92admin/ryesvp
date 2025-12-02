import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getNotifications, getUnreadCount, markAllAsRead } from '@/db/notifications';

// GET /api/notifications - Get user's notifications with unread count
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId, 50),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Mark all as read
export async function POST() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;

    const result = await markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

