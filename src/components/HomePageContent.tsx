'use client';

import { useState } from 'react';
import { ViewToggle } from './ViewToggle';
import { SocialTab } from './SocialTab';
import { EventListWithPagination } from './EventListWithPagination';
import { CalendarSidebar } from './CalendarSidebar';
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
  const [currentView, setCurrentView] = useState<'calendar' | 'social'>('calendar');

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <ViewToggle 
        defaultView="calendar" 
        onViewChange={setCurrentView}
      />

      {/* Conditional Layout */}
      {currentView === 'calendar' ? (
        /* Calendar View: Two-column with sidebar on desktop only */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Sidebar - Desktop only (hidden on mobile per UX charter) */}
          <aside className="hidden lg:block lg:order-last lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:scrollbar-thin">
              <CalendarSidebar isLoggedIn={isLoggedIn} />
            </div>
          </aside>

          {/* Events List - Main Column (has DiscoveryStrip for mobile) */}
          <div className="flex-1 min-w-0">
            <EventListWithPagination
              initialEvents={initialEvents}
              initialHasMore={initialHasMore}
              filters={filters}
            />
          </div>
        </div>
      ) : (
        /* Social View: Full-width, no sidebar */
        <div className="w-full">
          <SocialTab />
        </div>
      )}
    </div>
  );
}
