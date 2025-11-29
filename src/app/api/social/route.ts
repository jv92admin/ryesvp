import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getYourPlans, getAlmostPlans, getTicketActivity } from '@/db/social';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all social data in parallel
    const [yourPlans, almostPlans, ticketActivity] = await Promise.all([
      getYourPlans(user.dbUser.id),
      getAlmostPlans(user.dbUser.id),
      getTicketActivity(user.dbUser.id),
    ]);

    return NextResponse.json({
      yourPlans,
      almostPlans,
      ticketActivity,
    });
  } catch (error) {
    console.error('Error fetching social data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social data' },
      { status: 500 }
    );
  }
}
