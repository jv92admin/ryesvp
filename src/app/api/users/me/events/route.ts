// GET /api/users/me/events - Get current user's upcoming events
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/db/prisma';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userEvents = await prisma.userEvent.findMany({
      where: {
        userId: user.dbUser.id,
        status: { in: ['GOING', 'INTERESTED'] },
        event: {
          startDateTime: { gte: new Date() },
          status: 'SCHEDULED',
        },
      },
      include: {
        event: {
          include: {
            venue: true,
            enrichment: {
              select: {
                tmEventName: true,
                tmPreferTitle: true,
              },
            },
          },
        },
      },
      orderBy: {
        event: { startDateTime: 'asc' },
      },
      take: 10,
    });

    return NextResponse.json({
      events: userEvents.map((ue) => {
        // Compute displayTitle using same logic as data layer
        const displayTitle = ue.event.enrichment?.tmPreferTitle && ue.event.enrichment?.tmEventName
          ? ue.event.enrichment.tmEventName
          : ue.event.title;
        
        return {
          id: ue.id,
          status: ue.status,
          event: {
            id: ue.event.id,
            title: displayTitle, // Use computed displayTitle
            startDateTime: ue.event.startDateTime.toISOString(),
            venue: { name: ue.event.venue.name },
          },
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

