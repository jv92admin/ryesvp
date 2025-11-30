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

    // Parse filter params from URL
    const searchParams = req.nextUrl.searchParams;
    const filters = {
      venueIds: searchParams.get('venueIds')?.split(',').filter(Boolean),
      categories: searchParams.get('categories')?.split(',').filter(Boolean),
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')! + 'T23:59:59') : undefined,
    };

    // Fetch all social data in parallel (with filters)
    const [yourPlans, almostPlans, ticketActivity] = await Promise.all([
      getYourPlans(user.dbUser.id, filters),
      getAlmostPlans(user.dbUser.id, filters),
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
