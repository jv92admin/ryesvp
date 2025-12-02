import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { acceptFriendRequest } from '@/db/friends';
import { createNotification } from '@/db/notifications';

// POST /api/friends/accept - Accept a friend request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { friendshipId } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'friendshipId is required' },
        { status: 400 }
      );
    }

    const friendship = await acceptFriendRequest(friendshipId, user.dbUser.id);

    // Send notification to the requester that their request was accepted
    await createNotification(friendship.requesterId, 'FRIEND_REQUEST_ACCEPTED', {
      actorId: user.dbUser.id,
      actorName: user.dbUser.displayName || user.supabaseUser.email.split('@')[0],
    });

    return NextResponse.json({ friendship });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept friend request';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

