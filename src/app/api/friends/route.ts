import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFriends, getPendingRequests, getSentRequests, getPendingRequestCount } from '@/db/friends';

// GET /api/friends - List user's friends and pending requests
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;

    const [friends, pendingReceived, pendingSent, pendingCount] = await Promise.all([
      getFriends(userId),
      getPendingRequests(userId),
      getSentRequests(userId),
      getPendingRequestCount(userId),
    ]);

    return NextResponse.json({
      friends,
      pendingReceived,
      pendingSent,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

