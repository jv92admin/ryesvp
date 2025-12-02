import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendFriendRequest } from '@/db/friends';
import prisma from '@/db/prisma';
import { createNotification } from '@/db/notifications';

// POST /api/friends/request - Send a friend request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { addresseeId } = body;

    if (!addresseeId) {
      return NextResponse.json(
        { error: 'addresseeId is required' },
        { status: 400 }
      );
    }

    if (addresseeId === user.dbUser.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Verify addressee exists
    const addressee = await prisma.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const friendship = await sendFriendRequest(user.dbUser.id, addresseeId);

    // Send notification to the addressee
    await createNotification(addresseeId, 'FRIEND_REQUEST_RECEIVED', {
      actorId: user.dbUser.id,
      actorName: user.dbUser.displayName || user.supabaseUser.email.split('@')[0],
    });

    return NextResponse.json({ friendship });
  } catch (error) {
    console.error('Error sending friend request:', error);
    const message = error instanceof Error ? error.message : 'Failed to send friend request';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

