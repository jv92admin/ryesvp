'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const discoveryParam = searchParams.get('discovery');
  
  const [events, setEvents] = useState<EventDisplay[]>(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [activeDiscoveryChip, setActiveDiscoveryChip] = useState<string | null>(
    discoveryParam === 'presales' || discoveryParam === 'new' ? discoveryParam : null
  );
  
  // Presale data from API (same source as CalendarSidebar)
  const [presalesCount, setPresalesCount] = useState(0);
  const [presaleEvents, setPresaleEvents] = useState<Array<{
    id: string;
    title: string;
    startDateTime: string;
    venue: { name: string };
    presaleType: 'active' | 'upcoming' | 'onsale';
    presaleName?: string;
    presaleDate?: string;
  }>>([]);

  // New listings count and events from API (not calculated from loaded events)
  const [newListingsCount, setNewListingsCount] = useState(0);
  const [newListingEvents, setNewListingEvents] = useState<Array<{
    id: string;
    title: string;
    startDateTime: string;
    createdAt: string;
    venue: { name: string };
  }>>([]);

  // Fetch discovery chip counts from APIs
  useEffect(() => {
    async function fetchDiscoveryCounts() {
      try {
        // Fetch both in parallel
        const [presalesRes, recentRes] = await Promise.all([
          fetch('/api/events/presales'),
          fetch('/api/events/recent'),
        ]);
        
        if (presalesRes.ok) {
          const data = await presalesRes.json();
          const fetchedPresales = data.events || [];
          setPresalesCount(fetchedPresales.length);
          setPresaleEvents(fetchedPresales);
        }
        
        if (recentRes.ok) {
          const data = await recentRes.json();
          setNewListingsCount(data.totalCount || 0);
          setNewListingEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching discovery counts:', error);
      }
    }
    fetchDiscoveryCounts();
  }, []);

  // Display events (new and presales are handled separately with their own API data)
  const displayEvents = useMemo(() => {
    // New and presales have their own views, so just return all events here
    return events;
  }, [events]);

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
        presalesCount={presalesCount}
        activeChip={activeDiscoveryChip}
        onChipClick={handleDiscoveryChipClick}
      />

      {/* New Listings View - separate render when new filter is active */}
      {activeDiscoveryChip === 'new' ? (
        newListingEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No new listings in the last 48 hours.</p>
            <button
              onClick={() => setActiveDiscoveryChip(null)}
              className="mt-2 text-[var(--brand-primary)] hover:text-green-700 text-sm font-medium"
            >
              Show all events
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {newListingEvents.map((event) => (
                <a
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-[var(--brand-primary)] text-white">
                          ✨ NEW
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.venue.name} • {new Date(event.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        )
      ) : activeDiscoveryChip === 'presales' ? (
        presaleEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No upcoming presales or on-sale events.</p>
            <button
              onClick={() => setActiveDiscoveryChip(null)}
              className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="space-y-2">
              {presaleEvents.map((event) => (
                <a
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {event.presaleType === 'active' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500 text-white">
                            🔐 {event.presaleName || 'PRESALE'} NOW
                          </span>
                        )}
                        {event.presaleType === 'upcoming' && event.presaleDate && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            ⚡ {event.presaleName || 'PRESALE'} {new Date(event.presaleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {event.presaleType === 'onsale' && event.presaleDate && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">
                            🎫 ON SALE {new Date(event.presaleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.venue.name} • {new Date(event.startDateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        )
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found matching your filters.</p>
        </div>
      ) : (
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
      )}

      {/* Load More / Status - hide when discovery filters are active */}
      {!activeDiscoveryChip && (
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
      )}
    </>
  );
}

