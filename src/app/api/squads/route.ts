import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSquad } from '@/db/squads';
import { createNotification } from '@/db/notifications';
import { format } from 'date-fns';

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

    const { eventId, inviteFriendIds } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const squad = await createSquad({
      eventId,
      createdById: user.dbUser.id,
      inviteFriendIds: inviteFriendIds || [],
    });

    // Send notifications to invited friends
    const invitedMembers = squad.members.filter(
      m => m.userId !== user.dbUser.id
    );

    if (invitedMembers.length > 0) {
      const eventTitle = squad.event.title;
      const eventDate = format(squad.event.startDateTime, 'MMM d');
      const actorName = user.dbUser.displayName || 'Someone';

      for (const member of invitedMembers) {
        await createNotification(member.userId, 'ADDED_TO_PLAN', {
          actorId: user.dbUser.id,
          actorName,
          squadId: squad.id,
          eventId: squad.eventId,
          eventTitle,
          eventDate,
        });
      }
    }

    return NextResponse.json({ squad });
  } catch (error: any) {
    console.error('Error creating squad:', error);
    
    if (error.message === 'You already have a plan for this event') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
