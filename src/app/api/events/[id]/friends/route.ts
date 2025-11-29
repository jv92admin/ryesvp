import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFriendIds } from '@/db/friends';
import prisma from '@/db/prisma';
import { AttendanceStatus } from '@prisma/client';

// GET /api/events/[id]/friends - Get friends and their status for this event
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

    const friendIds = await getFriendIds(user.dbUser.id);

    if (friendIds.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    // Get friends with their status for this event
    const friends = await prisma.user.findMany({
      where: {
        id: { in: friendIds },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        userEvents: {
          where: { eventId },
          select: { status: true },
        },
      },
    });

    const friendsWithStatus = friends.map(friend => ({
      id: friend.id,
      displayName: friend.displayName || friend.email,
      email: friend.email,
      status: friend.userEvents[0]?.status || null,
      isInterested: friend.userEvents[0]?.status === AttendanceStatus.INTERESTED || 
                   friend.userEvents[0]?.status === AttendanceStatus.GOING ||
                   friend.userEvents[0]?.status === AttendanceStatus.NEED_TICKETS ||
                   friend.userEvents[0]?.status === AttendanceStatus.HAVE_TICKETS,
    }));

    // Sort: interested friends first, then others alphabetically
    friendsWithStatus.sort((a, b) => {
      if (a.isInterested && !b.isInterested) return -1;
      if (!a.isInterested && b.isInterested) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return NextResponse.json({ friends: friendsWithStatus });
  } catch (error) {
    console.error('Error fetching friends for event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}
