import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/db/events';
import { EventCategory, EventStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const category = searchParams.get('category') as EventCategory | null;
    const venueId = searchParams.get('venueId');
    const status = searchParams.get('status') as EventStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const events = await getEvents({
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      endDate: endDateParam ? new Date(endDateParam) : undefined,
      category: category || undefined,
      venueId: venueId || undefined,
      status: status || undefined,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

