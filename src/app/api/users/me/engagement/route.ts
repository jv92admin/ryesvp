// GET /api/users/me/engagement - Get user's engagement stats for onboarding tips
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/db/prisma';
import { getReferrer } from '@/db/invites';
import { countUserFutureEventsByStatus } from '@/db/userEvents';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.dbUser.id;

  // Get counts in parallel
  // Uses shared countUserFutureEventsByStatus to match Social feed logic
  const [
    futureEventCounts,
    friendCount,
    referrer,
  ] = await Promise.all([
    countUserFutureEventsByStatus(userId),
    prisma.friendship.count({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    }),
    getReferrer(userId),
  ]);

  const { going: goingCount, interested: interestedCount } = futureEventCounts;

  // Calculate friends excluding inviter (for tip 2 condition)
  const hasReferrer = !!referrer;
  const friendsExcludingInviter = hasReferrer ? Math.max(0, friendCount - 1) : friendCount;

  return NextResponse.json({
    goingCount,
    interestedCount,
    friendCount,
    friendsExcludingInviter,
    hasReferrer,
    // Computed flags for tips
    // Tip 1: Only check Going/Interested for FUTURE events (matches Social feed)
    showTip1: goingCount === 0 && interestedCount === 0,
    showTip2: friendsExcludingInviter === 0,
  });
}

