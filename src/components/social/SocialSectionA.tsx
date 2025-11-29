'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from '../SmartSquadButton';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SocialSectionAProps {
  events: EventDisplay[];
}

export function SocialSectionA({ events }: SocialSectionAProps) {
  // Collapsible state (mobile only)
  const [collapsed, setCollapsed] = useState(false);
  
  // Group events by time bucket
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  
  const soonEvents = events.filter(event => new Date(event.startDateTime) <= twoWeeksOut);
  const laterEvents = events.filter(event => new Date(event.startDateTime) > twoWeeksOut);

  const renderEventCard = (event: EventDisplay) => (
    <div
      key={event.id}
      className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <Link href={`/events/${event.id}`} className="flex-1 hover:text-purple-600">
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
            {event.displayTitle}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
          </p>
          <p className="text-xs text-gray-500">
            {event.venue.name}
          </p>
        </Link>
        
        {/* Image if available */}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.displayTitle}
            className="w-12 h-12 object-cover rounded-lg ml-3 flex-shrink-0"
          />
        )}
      </div>
      
      {/* Status indicators and Squad button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded font-medium ${
            event.social?.userStatus === 'GOING' 
              ? 'bg-emerald-100 text-emerald-700' 
              : event.social?.userStatus === 'INTERESTED'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {event.social?.userStatus === 'GOING' ? '✓ Going' : 
             event.social?.userStatus === 'INTERESTED' ? '★ Interested' : 
             '🎫 Tickets'}
          </span>
        </div>
        
        {/* Smart Squad Button */}
        <SmartSquadButton
          eventId={event.id}
          userSquadId={(event as any).userSquad?.id}
          friendsGoing={event.social?.friendsGoing || 0}
          friendsInterested={event.social?.friendsInterested || 0}
          event={{
            id: event.id,
            title: event.displayTitle,
            startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
            venue: { name: event.venue.name }
          }}
          variant="compact"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
      {/* Header - Collapsible on mobile only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full text-left lg:pointer-events-none"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className={`lg:hidden transform transition-transform ${collapsed ? 'rotate-0' : 'rotate-90'}`}>
            ▶️
          </span>
          📅 Your Plans
        </h2>
      </button>
      
      {/* Content - Hidden when collapsed on mobile */}
      <div className={`${collapsed ? 'hidden lg:block' : 'block'}`}>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm mb-2">You haven't made any plans yet.</p>
            <p className="text-xs">Mark events as "Going" or create a Squad to see them here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Soon Events (<14 days) */}
            {soonEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  Coming Up
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {soonEvents.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {soonEvents.map(renderEventCard)}
                </div>
              </div>
            )}

            {/* Later Events (>14 days) */}
            {laterEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span>📅</span>
                  Later This Year
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {laterEvents.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {laterEvents.map(renderEventCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
