// GET /api/friends/events - Get friends' upcoming events
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/db/prisma';
import { getFriendIds } from '@/db/friends';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get friend IDs
    const friendIds = await getFriendIds(user.dbUser.id);

    if (friendIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Get friends' upcoming events
    const friendEvents = await prisma.userEvent.findMany({
      where: {
        userId: { in: friendIds },
        status: 'GOING',
        event: {
          startDateTime: { gte: new Date() },
          status: 'SCHEDULED',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
          },
        },
      },
      orderBy: {
        event: { startDateTime: 'asc' },
      },
      take: 20,
    });

    return NextResponse.json({
      events: friendEvents.map((fe) => ({
        friendId: fe.user.id,
        friendName: fe.user.displayName || fe.user.email.split('@')[0],
        event: {
          id: fe.event.id,
          title: fe.event.title,
          startDateTime: fe.event.startDateTime.toISOString(),
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching friends events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

