import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { declineFriendRequest } from '@/db/friends';

// POST /api/friends/decline - Decline a friend request
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

    const friendship = await declineFriendRequest(friendshipId, user.dbUser.id);

    return NextResponse.json({ friendship });
  } catch (error) {
    console.error('Error declining friend request:', error);
    const message = error instanceof Error ? error.message : 'Failed to decline friend request';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

