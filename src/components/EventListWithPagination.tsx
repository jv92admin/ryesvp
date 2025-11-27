'use client';

import { useState, useEffect } from 'react';
import { EventCard } from '@/components/EventCard';
import { formatDateHeading, groupEventsByDateClient } from '@/lib/utils';
import type { EventWithSocial } from '@/db/events';

interface EventListWithPaginationProps {
  initialEvents: EventWithSocial[];
  initialHasMore: boolean;
  filters: {
    venueId?: string;
    startDate?: string;
    endDate?: string;
    myEvents?: boolean;
    friendsGoing?: boolean;
    listId?: string;
    communityId?: string;
  };
}

export function EventListWithPagination({
  initialEvents,
  initialHasMore,
  filters,
}: EventListWithPaginationProps) {
  const [events, setEvents] = useState<EventWithSocial[]>(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // Sync state when initialEvents changes (e.g., when filters are applied)
  useEffect(() => {
    setEvents(initialEvents);
    setHasMore(initialHasMore);
  }, [initialEvents, initialHasMore]);

  const loadMore = async () => {
    setLoading(true);
    
    // Build query string from filters
    const params = new URLSearchParams();
    params.set('offset', String(events.length));
    if (filters.venueId) params.set('venueId', filters.venueId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.myEvents) params.set('myEvents', 'true');
    if (filters.friendsGoing) params.set('friendsGoing', 'true');
    if (filters.listId) params.set('listId', filters.listId);
    if (filters.communityId) params.set('communityId', filters.communityId);
    
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

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events found matching your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {sortedDates.map((dateKey) => (
          <section key={dateKey}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
              {formatDateHeading(dateKey)}
            </h2>
            <div className="space-y-3">
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

