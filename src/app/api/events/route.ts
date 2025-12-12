// GET /api/events - Paginated events with social signals
import { NextRequest, NextResponse } from 'next/server';
import { getEventsWithSocialSignals } from '@/db/events';
import { getCurrentUser } from '@/lib/auth';
import { EventCategory } from '@prisma/client';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Pagination
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10);
  
  // Filters - support both single and multi-select
  const venueIdsParam = searchParams.get('venueIds');
  const venueIds = venueIdsParam ? venueIdsParam.split(',').filter(Boolean) : undefined;
  
  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam 
    ? categoriesParam.split(',').filter(Boolean) as EventCategory[]
    : undefined;
  
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const myEvents = searchParams.get('myEvents') === 'true';
  const friendsGoing = searchParams.get('friendsGoing') === 'true';
  const listId = searchParams.get('listId') || undefined;
  const communityId = searchParams.get('communityId') || undefined;
  
  // Discovery filters (Phase 1.6)
  const q = searchParams.get('q') || undefined;
  const newListings = searchParams.get('new') === 'true';
  const presales = searchParams.get('presales') === 'true';
  const when = searchParams.get('when') as 'today' | 'thisWeek' | 'weekend' | null;
  
  const user = await getCurrentUser();
  
  const events = await getEventsWithSocialSignals({
    venueIds,
    categories,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
    myEvents: user ? myEvents : false,
    friendsGoing: user ? friendsGoing : false,
    listId: user ? listId : undefined,
    communityId: user ? communityId : undefined,
    userId: user?.dbUser.id || '',
    limit: limit + 1, // Fetch one extra to check if more exist
    offset,
    // Discovery filters
    q,
    newListings,
    presales,
    when: when || undefined,
  });
  
  const hasMore = events.length > limit;
  const items = hasMore ? events.slice(0, -1) : events;
  
  return NextResponse.json({
    events: items,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  });
}
