'use client';

import { useState, useEffect, useMemo } from 'react';
import { EventCard } from '@/components/EventCard';
import { DiscoveryStrip } from '@/components/DiscoveryStrip';
import { formatDateHeading, groupEventsByDateClient, isNewListing } from '@/lib/utils';
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
  };
}

export function EventListWithPagination({
  initialEvents,
  initialHasMore,
  filters,
}: EventListWithPaginationProps) {
  const [events, setEvents] = useState<EventDisplay[]>(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [activeDiscoveryChip, setActiveDiscoveryChip] = useState<string | null>(null);

  // Count new listings
  const newListingsCount = useMemo(() => {
    return events.filter(e => isNewListing(e.createdAt)).length;
  }, [events]);

  // Filter events based on active discovery chip
  const displayEvents = useMemo(() => {
    if (activeDiscoveryChip === 'new') {
      return events.filter(e => isNewListing(e.createdAt));
    }
    return events;
  }, [events, activeDiscoveryChip]);

  const handleDiscoveryChipClick = (chipId: string) => {
    // Toggle: if already active, deactivate
    setActiveDiscoveryChip(prev => prev === chipId ? null : chipId);
  };

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
    if (filters.venueIds) params.set('venueIds', filters.venueIds);
    if (filters.categories) params.set('categories', filters.categories);
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
  const groupedEvents = groupEventsByDateClient(displayEvents);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <>
      {/* Discovery Strip - compact chips for quick filters */}
      <DiscoveryStrip
        newListingsCount={newListingsCount}
        activeChip={activeDiscoveryChip}
        onChipClick={handleDiscoveryChipClick}
      />

      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {activeDiscoveryChip === 'new' 
              ? 'No new listings in the last 48 hours.'
              : 'No events found matching your filters.'}
          </p>
          {activeDiscoveryChip && (
            <button
              onClick={() => setActiveDiscoveryChip(null)}
              className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active filter indicator */}
          {activeDiscoveryChip === 'new' && (
            <div className="flex items-center justify-between bg-[var(--brand-primary-light)] border border-green-200 rounded-lg px-3 py-1.5">
              <span className="text-sm text-[var(--brand-primary)]">
                Showing {displayEvents.length} new listing{displayEvents.length !== 1 ? 's' : ''} from the last 48 hours
              </span>
              <button
                onClick={() => setActiveDiscoveryChip(null)}
                className="text-[var(--brand-primary)] hover:text-green-800 text-sm font-medium"
              >
                Show all
              </button>
            </div>
          )}

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
      )}

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

