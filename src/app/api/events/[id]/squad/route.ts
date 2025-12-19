import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserSquadForEvent } from '@/db/squads';

// GET /api/events/[id]/squad - Check if user has a squad for this event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const squad = await getUserSquadForEvent(user.dbUser.id, eventId);

    return NextResponse.json({ 
      hasSquad: !!squad,
      squadId: squad?.id || null,
    });
  } catch (error) {
    console.error('Error checking user squad for event:', error);
    return NextResponse.json(
      { error: 'Failed to check plan status' },
      { status: 500 }
    );
  }
}
