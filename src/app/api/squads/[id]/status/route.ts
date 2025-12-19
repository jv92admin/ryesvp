import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateSquadMemberStatus, getSquadById } from '@/db/squads';
import { upsertUserEvent, deleteUserEvent } from '@/db/userEvents';
import { SquadMemberStatus, SquadTicketStatus, AttendanceStatus } from '@prisma/client';

// PUT /api/squads/[id]/status - Update member status
export async function PUT(
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

    const { status, ticketStatus, coveredById, buyingForIds, guestCount } = await req.json();

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this plan' },
        { status: 403 }
      );
    }

    // Validate enum values if provided
    if (status && !Object.values(SquadMemberStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    if (ticketStatus && !Object.values(SquadTicketStatus).includes(ticketStatus)) {
      return NextResponse.json(
        { error: 'Invalid ticket status value' },
        { status: 400 }
      );
    }

    // Validate coveredById if provided - must be a squad member
    if (coveredById) {
      const coveringMember = squad.members.find(m => m.userId === coveredById);
      if (!coveringMember) {
        return NextResponse.json(
          { error: 'Covering user is not a plan member' },
          { status: 400 }
        );
      }
    }

    // Validate buyingForIds if provided
    if (buyingForIds && Array.isArray(buyingForIds)) {
      // Ensure all IDs are valid squad members
      const validMemberIds = squad.members.map(m => m.userId);
      const invalidIds = buyingForIds.filter(id => !validMemberIds.includes(id));
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: 'Some user IDs are not plan members' },
          { status: 400 }
        );
      }
    }

    // Update squad member status first
    const updatedMember = await updateSquadMemberStatus(id, user.dbUser.id, {
      status,
      ticketStatus,
      coveredById: coveredById === null ? null : coveredById,
      buyingForIds: buyingForIds || undefined,
    });

    // Sync with event attendance status
    if (status) {
      try {
        if (status === SquadMemberStatus.IN) {
          // IN = Going to the event
          await upsertUserEvent({
            userId: user.dbUser.id,
            eventId: squad.eventId,
            status: AttendanceStatus.GOING,
            comment: null,
          });
        } else if (status === SquadMemberStatus.OUT) {
          // OUT = Remove event attendance 
          await deleteUserEvent(user.dbUser.id, squad.eventId);
        } else if (status === SquadMemberStatus.THINKING) {
          // THINKING = Interested in the event
          await upsertUserEvent({
            userId: user.dbUser.id,
            eventId: squad.eventId,
            status: AttendanceStatus.INTERESTED,
            comment: null,
          });
        }
      } catch (eventSyncError) {
        console.error('Event sync failed, but squad status was updated:', eventSyncError);
        // Continue - squad status was successfully updated
      }
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating squad member status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
