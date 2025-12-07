import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get events added in the last 48 hours
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const whereClause = {
      createdAt: {
        gte: cutoff,
      },
      startDateTime: {
        gte: new Date(), // Only future events
      },
    };

    // Get total count for the chip badge
    const totalCount = await prisma.event.count({ where: whereClause });

    // Get the most recent events for display (all of them for the filter)
    const recentEvents = await prisma.event.findMany({
      where: whereClause,
      include: {
        venue: {
          select: { name: true },
        },
      },
      orderBy: {
        startDateTime: 'asc', // Sort by event date, not created date
      },
      take: 100, // Reasonable limit
    });

    const events = recentEvents.map(event => ({
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
      venue: {
        name: event.venue.name,
      },
    }));

    return NextResponse.json({ events, totalCount });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent events' },
      { status: 500 }
    );
  }
}
