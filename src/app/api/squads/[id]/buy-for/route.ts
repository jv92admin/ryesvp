import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById, buyForSquadMembers, uncoverSquadMember } from '@/db/squads';
import { createNotifications } from '@/db/notifications';
import { format } from 'date-fns';

// POST /api/squads/[id]/buy-for - Buy tickets for multiple squad members
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { memberIds } = await req.json();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'memberIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this squad' },
        { status: 403 }
      );
    }

    // Validate all memberIds are squad members
    const validMemberIds = squad.members.map(m => m.userId);
    const invalidIds = memberIds.filter((memberId: string) => !validMemberIds.includes(memberId));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Some user IDs are not squad members' },
        { status: 400 }
      );
    }

    // Execute the buy-for operation
    await buyForSquadMembers(id, user.dbUser.id, memberIds);

    // Get event details for notification
    const eventTitle = squad.event.enrichment?.tmPreferTitle && squad.event.enrichment?.tmEventName
      ? squad.event.enrichment.tmEventName
      : squad.event.title;
    const eventDate = format(squad.event.startDateTime, 'MMM d');
    const actorName = user.dbUser.displayName || 'Someone';

    // Notify covered members (except the buyer)
    const coveredMemberIds = memberIds.filter((memberId: string) => memberId !== user.dbUser.id);
    if (coveredMemberIds.length > 0) {
      await createNotifications(coveredMemberIds, 'TICKET_COVERED_FOR_YOU', {
        actorId: user.dbUser.id,
        actorName,
        squadId: id,
        eventId: squad.eventId,
        eventTitle,
        eventDate,
      });
    }

    // Return updated squad
    const updatedSquad = await getSquadById(id);
    return NextResponse.json({ squad: updatedSquad });
  } catch (error) {
    console.error('Error buying for squad members:', error);
    return NextResponse.json(
      { error: 'Failed to buy for members' },
      { status: 500 }
    );
  }
}

// DELETE /api/squads/[id]/buy-for - Remove coverage from a member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this squad' },
        { status: 403 }
      );
    }

    // Execute uncover operation
    await uncoverSquadMember(id, memberId, user.dbUser.id);

    // Return updated squad
    const updatedSquad = await getSquadById(id);
    return NextResponse.json({ squad: updatedSquad });
  } catch (error) {
    console.error('Error removing coverage:', error);
    return NextResponse.json(
      { error: 'Failed to remove coverage' },
      { status: 500 }
    );
  }
}

