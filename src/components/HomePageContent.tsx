'use client';

import { useState, useEffect } from 'react';
import { ViewToggle } from './ViewToggle';
import { SocialTab } from './SocialTab';
import { EventListWithPagination } from './EventListWithPagination';
import { CalendarSidebar } from './CalendarSidebar';
import { EventDisplay } from '@/db/events';
import { getInstantBadgeCount } from '@/lib/squadNotifications';

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
  };
}

export function HomePageContent({ initialEvents, initialHasMore, isLoggedIn, filters }: HomePageContentProps) {
  const [currentView, setCurrentView] = useState<'calendar' | 'social'>('calendar');
  const [socialBadgeCount, setSocialBadgeCount] = useState(0);

  // Get instant badge count from localStorage on mount (no API call)
  useEffect(() => {
    if (isLoggedIn) {
      const instantCount = getInstantBadgeCount();
      setSocialBadgeCount(instantCount);
    }
  }, [isLoggedIn]);

  // Add debug function to console (development only)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).clearSquadNotifications = () => {
        localStorage.removeItem('ryesvp_viewed_squads');
        console.log('✅ Cleared all squad notifications from localStorage');
        window.location.reload(); // Auto-refresh to show changes
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <ViewToggle 
        defaultView="calendar" 
        onViewChange={setCurrentView}
        socialBadgeCount={socialBadgeCount}
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
          <SocialTab onBadgeCountChange={setSocialBadgeCount} />
        </div>
      )}
    </div>
  );
}
