'use client';

import { useState, useEffect, useRef } from 'react';
import { EventCard } from '@/components/EventCard';
import { formatDateHeading, groupEventsByDateClient } from '@/lib/utils';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
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
  const [isRestoring, setIsRestoring] = useState(false);
  const hasRestoredRef = useRef(false);
  const { getSavedPaginationState, getSavedScrollPosition, savePaginationState } = useScrollRestoration();

  // Sync state when initialEvents changes (e.g., when filters are applied via URL)
  // Also check if we need to restore more events from a previous session
  useEffect(() => {
    const restoreState = async () => {
      // Only try to restore once per mount
      if (hasRestoredRef.current) {
        setEvents(initialEvents);
        setHasMore(initialHasMore);
        return;
      }
      hasRestoredRef.current = true;

      const savedCount = getSavedPaginationState();
      const savedScrollPosition = getSavedScrollPosition();
      
      // If we have a saved pagination state and need more events than initial
      if (savedCount && savedCount > initialEvents.length && initialHasMore) {
        setIsRestoring(true);
        
        // Fetch all the events we had before
        const params = new URLSearchParams();
        params.set('limit', String(savedCount));
        if (filters.venueIds) params.set('venueIds', filters.venueIds);
        if (filters.categories) params.set('categories', filters.categories);
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (filters.myEvents) params.set('myEvents', 'true');
        if (filters.friendsGoing) params.set('friendsGoing', 'true');
        if (filters.listId) params.set('listId', filters.listId);
        if (filters.communityId) params.set('communityId', filters.communityId);
        if (filters.q) params.set('q', filters.q);
        if (filters.newListings) params.set('new', 'true');
        if (filters.presales) params.set('presales', 'true');
        if (filters.when) params.set('when', filters.when);
        
        try {
          const res = await fetch(`/api/events?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setEvents(data.events);
            setHasMore(data.hasMore);
            
            // Restore scroll position after events are loaded
            // Give React time to render all events before scrolling
            if (savedScrollPosition !== null) {
              setTimeout(() => {
                window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
              }, 300);
            }
          }
        } catch (error) {
          console.error('Error restoring events:', error);
          setEvents(initialEvents);
          setHasMore(initialHasMore);
        } finally {
          setIsRestoring(false);
        }
      } else {
        setEvents(initialEvents);
        setHasMore(initialHasMore);
      }
    };

    restoreState();
  }, [initialEvents, initialHasMore, filters, getSavedPaginationState, getSavedScrollPosition]);

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
      const newEvents = [...events, ...data.events];
      setEvents(newEvents);
      setHasMore(data.hasMore);
      
      // Save pagination state so we can restore it on back navigation
      savePaginationState(newEvents.length);
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group events by date
  const groupedEvents = groupEventsByDateClient(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  // Loading state when restoring pagination
  if (isRestoring) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

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
      <div className="space-y-6">
        {sortedDates.map((dateKey) => (
          <section key={dateKey}>
            <h2 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3 sticky top-0 bg-[var(--surface-bg)] py-2 z-10 border-b border-[var(--border-default)]">
              {formatDateHeading(dateKey)}
            </h2>
            <div className="space-y-0">
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
