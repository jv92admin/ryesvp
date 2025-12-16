// GET /api/users/me/engagement - Get user's engagement stats for onboarding tips
// POST /api/users/me/engagement - Mark onboarding complete or first engagement
import { NextRequest, NextResponse } from 'next/server';
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

  // Update lastVisitAt on each engagement check (this is called on page load)
  // Also fetch current user state for onboarding fields
  const [
    updatedUser,
    futureEventCounts,
    friendCount,
    referrer,
  ] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { lastVisitAt: new Date() },
      select: {
        onboardingCompletedAt: true,
        firstEngagementAt: true,
        lastVisitAt: true,
      },
    }),
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
    // Counts
    goingCount,
    interestedCount,
    friendCount,
    friendsExcludingInviter,
    hasReferrer,
    
    // Engagement tracking fields (from DB, replaces localStorage)
    onboardingCompletedAt: updatedUser.onboardingCompletedAt,
    firstEngagementAt: updatedUser.firstEngagementAt,
    
    // Computed flags for tips (pure contextual - no localStorage needed)
    // Tip 1: Show until user has marked any future event as Going/Interested
    showTip1: goingCount === 0 && interestedCount === 0,
    // Tip 2: Show until user has friends beyond their inviter
    showTip2: friendsExcludingInviter === 0,
    // Onboarding modal: Show if never completed
    showOnboarding: !updatedUser.onboardingCompletedAt,
    // First engagement toast: Show if first time (firstEngagementAt was null)
    showFirstEngagementToast: !updatedUser.firstEngagementAt && (goingCount > 0 || interestedCount > 0),
  });
}

// POST /api/users/me/engagement - Mark milestones
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.dbUser.id;
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'complete_onboarding': {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }
    
    case 'mark_first_engagement': {
      // Only set if not already set
      await prisma.user.updateMany({
        where: { 
          id: userId,
          firstEngagementAt: null,
        },
        data: { firstEngagementAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

