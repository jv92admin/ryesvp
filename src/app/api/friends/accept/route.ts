import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { acceptFriendRequest } from '@/db/friends';

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

