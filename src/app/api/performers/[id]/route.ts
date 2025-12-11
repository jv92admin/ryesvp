import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Fetch performer with basic info
    const performer = await prisma.performer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        bio: true,
        imageUrl: true,
        websiteUrl: true,
        tags: true,
        spotifyId: true,
      },
    });

    if (!performer) {
      return NextResponse.json({ error: 'Performer not found' }, { status: 404 });
    }

    const now = new Date();

    // Get 1 most recent past event
    const pastEvent = await prisma.event.findFirst({
      where: {
        performerId: id,
        startDateTime: { lt: now },
      },
      orderBy: { startDateTime: 'desc' },
      select: {
        id: true,
        title: true,
        startDateTime: true,
        venue: {
          select: {
            name: true,
            slug: true,
          },
        },
        enrichment: {
          select: {
            tmPreferTitle: true,
            tmEventName: true,
          },
        },
      },
    });

    // Get 1 upcoming event
    const upcomingEvent = await prisma.event.findFirst({
      where: {
        performerId: id,
        startDateTime: { gte: now },
      },
      orderBy: { startDateTime: 'asc' },
      select: {
        id: true,
        title: true,
        startDateTime: true,
        venue: {
          select: {
            name: true,
            slug: true,
          },
        },
        enrichment: {
          select: {
            tmPreferTitle: true,
            tmEventName: true,
          },
        },
      },
    });

    // Build Spotify URL if we have the ID
    const spotifyUrl = performer.spotifyId
      ? `https://open.spotify.com/artist/${performer.spotifyId}`
      : null;

    return NextResponse.json({
      performer: {
        ...performer,
        spotifyUrl,
      },
      pastEvent: pastEvent
        ? {
            ...pastEvent,
            displayTitle:
              (pastEvent.enrichment?.tmPreferTitle && pastEvent.enrichment?.tmEventName)
                ? pastEvent.enrichment.tmEventName
                : pastEvent.title,
          }
        : null,
      upcomingEvent: upcomingEvent
        ? {
            ...upcomingEvent,
            displayTitle:
              (upcomingEvent.enrichment?.tmPreferTitle && upcomingEvent.enrichment?.tmEventName)
                ? upcomingEvent.enrichment.tmEventName
                : upcomingEvent.title,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching performer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

