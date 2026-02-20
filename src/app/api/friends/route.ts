import { NextResponse } from 'next/server';
import { requireAuthAPI, handleAPIError } from '@/lib/auth';
import { getFriends, getPendingRequests, getSentRequests, getPendingRequestCount } from '@/db/friends';

// GET /api/friends - List user's friends and pending requests
export async function GET() {
  try {
    const user = await requireAuthAPI();
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
    return handleAPIError(error);
  }
}
