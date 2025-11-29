import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get events added in the last 48 hours
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const recentEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: cutoff,
        },
        startDateTime: {
          gte: new Date(), // Only future events
        },
      },
      include: {
        venue: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
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

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent events' },
      { status: 500 }
    );
  }
}
