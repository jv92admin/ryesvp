import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { markAsRead } from '@/db/notifications';

// PATCH /api/notifications/[id] - Mark a single notification as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;
    const { id } = await params;

    const notification = await markAsRead(id, userId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

