import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSquad } from '@/db/squads';

// POST /api/squads - Create a new squad
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const squad = await createSquad({
      eventId,
      createdById: user.dbUser.id,
    });

    return NextResponse.json({ squad });
  } catch (error: any) {
    console.error('Error creating squad:', error);
    
    if (error.message === 'You already have a squad for this event') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create squad' },
      { status: 500 }
    );
  }
}
