'use client';

import { useState, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { formatDateHeading, groupEventsByDateClient } from '@/lib/utils';
import type { EventDisplay } from '@/db/events';

interface EventListWithPaginationProps {
  initialEvents: EventDisplay[];
  initialHasMore: boolean;
  filters: {
    venueIds?: string;
    categories?: string;
    startDate?: string;
    endDate?: string;
    myEvents?: boolean;
    friendsGoing?: boolean;
    listId?: string;
    communityId?: string;
    // Discovery filters (Phase 1.6)
    q?: string;
    newListings?: boolean;
    presales?: boolean;
    when?: 'today' | 'thisWeek' | 'weekend';
  };
}

/**
 * Event list with pagination and date grouping.
 * 
 * Simplified in Phase 1.6:
 * - Removed legacy DiscoveryStrip (now in FilterStrip)
 * - Removed separate New/Presales views (now integrated via URL params)
 * - All filtering happens server-side via URL params
 */
export function EventListWithPagination({
  initialEvents,
  initialHasMore,
  filters,
}: EventListWithPaginationProps) {
  const [events, setEvents] = useState<EventDisplay[]>(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // Sync state when initialEvents changes (e.g., when filters are applied via URL)
  useEffect(() => {
    setEvents(initialEvents);
    setHasMore(initialHasMore);
  }, [initialEvents, initialHasMore]);

  const loadMore = async () => {
    setLoading(true);
    
    // Build query string from filters
    const params = new URLSearchParams();
    params.set('offset', String(events.length));
    if (filters.venueIds) params.set('venueIds', filters.venueIds);
    if (filters.categories) params.set('categories', filters.categories);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.myEvents) params.set('myEvents', 'true');
    if (filters.friendsGoing) params.set('friendsGoing', 'true');
    if (filters.listId) params.set('listId', filters.listId);
    if (filters.communityId) params.set('communityId', filters.communityId);
    // Discovery filters (Phase 1.6)
    if (filters.q) params.set('q', filters.q);
    if (filters.newListings) params.set('new', 'true');
    if (filters.presales) params.set('presales', 'true');
    if (filters.when) params.set('when', filters.when);
    
    try {
      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load events');
      
      const data = await res.json();
      setEvents([...events, ...data.events]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by date
  const groupedEvents = groupEventsByDateClient(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  // Empty state
  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events found matching your filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Event list grouped by date */}
      <div className="space-y-4">
        {sortedDates.map((dateKey) => (
          <section key={dateKey}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-gray-50 py-1 z-10">
              {formatDateHeading(dateKey)}
            </h2>
            <div className="space-y-2">
              {groupedEvents.get(dateKey)!.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Load More / Status */}
      <div className="text-center mt-8">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Events'}
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Showing all {events.length} events
          </p>
        )}
      </div>
    </>
  );
}
