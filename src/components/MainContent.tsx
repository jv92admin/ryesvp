'use client';

import { useState } from 'react';
import { ViewToggle } from './ViewToggle';
import { SocialTab } from './SocialTab';
import { EventListWithPagination } from './EventListWithPagination';
import { EventDisplay } from '@/db/events';

interface MainContentProps {
  initialEvents: EventDisplay[];
  initialHasMore: boolean;
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

export function MainContent({ initialEvents, initialHasMore, filters }: MainContentProps) {
  const [currentView, setCurrentView] = useState<'calendar' | 'social'>('calendar');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <ViewToggle 
        defaultView="calendar" 
        onViewChange={setCurrentView}
      />

      {/* Two-column layout for social view */}
      <div className={currentView === 'social' ? 'max-w-full' : ''}>
        {/* Conditional Content */}
        {currentView === 'calendar' ? (
          <EventListWithPagination
            initialEvents={initialEvents}
            initialHasMore={initialHasMore}
            filters={filters}
          />
        ) : (
          <SocialTab />
        )}
      </div>
    </div>
  );
}
