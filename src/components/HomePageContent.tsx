'use client';

import { EventListWithPagination } from './EventListWithPagination';
import { CalendarSidebar } from './CalendarSidebar';
import { PlansStrip } from './PlansStrip';
import { EventDisplay } from '@/db/events';

interface HomePageContentProps {
  initialEvents: EventDisplay[];
  initialHasMore: boolean;
  isLoggedIn: boolean;
  filters: {
    venueIds?: string;
    categories?: string;
    startDate?: string;
    endDate?: string;
    myEvents: boolean;
    friendsGoing: boolean;
    listId?: string;
    communityId?: string;
    // Discovery filters (Phase 1.6)
    q?: string;
    newListings?: boolean;
    presales?: boolean;
    when?: 'today' | 'thisWeek' | 'weekend';
  };
}

export function HomePageContent({ initialEvents, initialHasMore, isLoggedIn, filters }: HomePageContentProps) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-3xl)' }}>
      {/* Plans Strip - logged-in users only */}
      {isLoggedIn && <PlansStrip />}

      {/* Two-column layout with sidebar on desktop */}
      <div className="flex flex-col lg:flex-row" style={{ gap: 'var(--space-xl)' }}>
        {/* Calendar Sidebar - Desktop only (hidden on mobile per UX charter) */}
        <aside className="hidden lg:block lg:order-last lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:scrollbar-thin">
            <CalendarSidebar isLoggedIn={isLoggedIn} />
          </div>
        </aside>

        {/* Events List - Main Column */}
        <div className="flex-1 min-w-0">
          <EventListWithPagination
            initialEvents={initialEvents}
            initialHasMore={initialHasMore}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}
