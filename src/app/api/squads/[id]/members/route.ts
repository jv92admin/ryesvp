import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addSquadMember, getSquadById } from '@/db/squads';
import prisma from '@/db/prisma';
import { createNotification, createNotifications } from '@/db/notifications';
import { format } from 'date-fns';

// POST /api/squads/[id]/members - Join squad or add member (if organizer)
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

    const { userId } = await req.json();
    const targetUserId = userId || user.dbUser.id; // Default to current user if no userId specified

    // Check if squad exists and is accessible
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    // If adding someone else, verify current user is a member (for now, any member can invite)
    if (targetUserId !== user.dbUser.id) {
      const currentUserMember = squad.members.find(member => member.userId === user.dbUser.id);
      if (!currentUserMember) {
        return NextResponse.json(
          { error: 'Not authorized to add members to this squad' },
          { status: 403 }
        );
      }
    }

    // Check if target user is already a member
    const existingMember = squad.members.find(member => member.userId === targetUserId);
    if (existingMember) {
      return NextResponse.json(
        { error: targetUserId === user.dbUser.id ? 'You are already a member of this squad' : 'User is already a member of this squad' },
        { status: 409 }
      );
    }

    const newMember = await addSquadMember(id, targetUserId);

    // Get event details for notification
    const eventTitle = squad.event.enrichment?.tmPreferTitle && squad.event.enrichment?.tmEventName
      ? squad.event.enrichment.tmEventName
      : squad.event.title;
    const eventDate = format(squad.event.startDateTime, 'MMM d');
    const actorName = user.dbUser.displayName || 'Someone';

    // If someone else added this user, notify the new member
    if (targetUserId !== user.dbUser.id) {
      await createNotification(targetUserId, 'ADDED_TO_PLAN', {
        actorId: user.dbUser.id,
        actorName,
        squadId: id,
        eventId: squad.eventId,
        eventTitle,
        eventDate,
      });
    }

    // Notify the organizer if someone joined THEMSELVES (not when organizer adds someone)
    // - If targetUserId === user.dbUser.id: user is joining themselves → notify organizer
    // - If targetUserId !== user.dbUser.id: organizer is adding someone → don't notify (redundant)
    const isSelfJoin = targetUserId === user.dbUser.id;
    const organizer = squad.members.find(m => m.isOrganizer);
    if (isSelfJoin && organizer && organizer.userId !== targetUserId) {
      // Get the new member's name
      const newMemberUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { displayName: true },
      });
      const newMemberName = newMemberUser?.displayName || 'Someone';

      await createNotification(organizer.userId, 'PLAN_MEMBER_JOINED', {
        actorId: targetUserId,
        actorName: newMemberName,
        squadId: id,
        eventId: squad.eventId,
        eventTitle,
      });
    }

    return NextResponse.json({ member: newMember });
  } catch (error: any) {
    console.error('Error adding squad member:', error);
    
    if (error.message === 'User already has a squad for this event') {
      return NextResponse.json(
        { error: 'User already has a squad for this event' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add member to squad' },
      { status: 500 }
    );
  }
}

// DELETE /api/squads/[id]/members - Leave squad or remove member
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

    const { userId } = await req.json();
    const targetUserId = userId || user.dbUser.id; // Default to current user if no userId specified

    // Check if squad exists
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    // Verify user is authorized to remove this member
    if (targetUserId !== user.dbUser.id) {
      const currentUserMember = squad.members.find(member => member.userId === user.dbUser.id);
      if (!currentUserMember?.isOrganizer) {
        return NextResponse.json(
          { error: 'Not authorized to remove other members' },
          { status: 403 }
        );
      }
    }

    // Find the member to remove
    const memberToRemove = squad.members.find(member => member.userId === targetUserId);
    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'User is not a member of this squad' },
        { status: 404 }
      );
    }

    // Get event details for notifications before removing member
    const eventTitle = squad.event.enrichment?.tmPreferTitle && squad.event.enrichment?.tmEventName
      ? squad.event.enrichment.tmEventName
      : squad.event.title;
    const eventDate = format(squad.event.startDateTime, 'MMM d');
    const leavingMemberUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { displayName: true },
    });
    const leavingMemberName = leavingMemberUser?.displayName || 'Someone';

    // Remove the member
    await prisma.squadMember.delete({
      where: { id: memberToRemove.id },
    });

    // If this was the organizer leaving and there are other members, transfer ownership
    if (memberToRemove.isOrganizer && squad.members.length > 1) {
      const nextOrganizer = squad.members.find(m => m.userId !== targetUserId);
      if (nextOrganizer) {
        await prisma.squadMember.update({
          where: { id: nextOrganizer.id },
          data: { isOrganizer: true },
        });
      }
    }

    // If this was the last member, delete the squad and notify all previous members
    if (squad.members.length === 1) {
      await prisma.squad.delete({
        where: { id },
      });
      // No one to notify since this was the last member
      return NextResponse.json({ squadDeleted: true });
    }

    // Notify the organizer that someone left THEMSELVES (not when organizer removes someone)
    // - If targetUserId === user.dbUser.id: user is leaving themselves → notify organizer
    // - If targetUserId !== user.dbUser.id: organizer is removing someone → don't notify (redundant)
    const isSelfLeave = targetUserId === user.dbUser.id;
    const organizer = squad.members.find(m => m.isOrganizer);
    if (isSelfLeave && organizer && organizer.userId !== targetUserId) {
      await createNotification(organizer.userId, 'PLAN_MEMBER_LEFT', {
        actorId: targetUserId,
        actorName: leavingMemberName,
        squadId: id,
        eventId: squad.eventId,
        eventTitle,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing squad member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from squad' },
      { status: 500 }
    );
  }
}
