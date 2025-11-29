'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from '../SmartSquadButton';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SocialSectionBProps {
  events: EventDisplay[];
}

export function SocialSectionB({ events }: SocialSectionBProps) {
  // Collapsible state (mobile only)
  const [collapsed, setCollapsed] = useState(false);
  
  // Group events by priority (mutual interest + timeframe)  
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  
  // Hot leads: <2 weeks + I'm also interested
  const hotLeads = events.filter(event => {
    const isWithin2Weeks = new Date(event.startDateTime) <= twoWeeksOut;
    const userHasInterest = event.social?.userStatus === 'INTERESTED' || event.social?.userStatus === 'GOING';
    return isWithin2Weeks && userHasInterest;
  });
  
  // Soon: <2 weeks + I'm not involved  
  const soonEvents = events.filter(event => {
    const isWithin2Weeks = new Date(event.startDateTime) <= twoWeeksOut;
    const userHasInterest = event.social?.userStatus === 'INTERESTED' || event.social?.userStatus === 'GOING';
    return isWithin2Weeks && !userHasInterest;
  });
  
  // Later: >2 weeks (mixed)
  const laterEvents = events.filter(event => {
    const isWithin2Weeks = new Date(event.startDateTime) <= twoWeeksOut;
    return !isWithin2Weeks;
  });

  const renderEventCard = (event: EventDisplay, isHotLead = false) => {
    const totalFriends = (event.social?.friendsGoing || 0) + (event.social?.friendsInterested || 0);
    
    return (
      <div
        key={event.id}
        className={`p-4 border rounded-lg transition-colors ${
          isHotLead 
            ? 'border-purple-200 bg-purple-50/50' 
            : 'border-gray-100 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link
              href={`/events/${event.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 block line-clamp-1"
            >
              {event.displayTitle}
            </Link>
            <p className="text-sm text-gray-600 mt-1">
              {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
            </p>
            <p className="text-xs text-gray-500">
              {event.venue.name}
            </p>
          </div>
          
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.displayTitle}
              className="w-12 h-12 object-cover rounded-lg ml-3 flex-shrink-0"
            />
          )}
        </div>
        
        {/* Friend activity summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {event.social?.userStatus && (
              <>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  event.social?.userStatus === 'GOING' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  You: {event.social?.userStatus === 'GOING' ? 'Going' : 'Interested'}
                </span>
                <span className="text-gray-400">•</span>
              </>
            )}
            <span className={`font-medium ${
              isHotLead ? 'text-purple-700' : 'text-purple-600'
            }`}>
              {/* Elegant friend breakdown */}
              {totalFriends > 0 && (
                <>
                  {(event.social?.friendsGoing || 0) > 0 && (event.social?.friendsInterested || 0) > 0 
                    ? `${totalFriends} friends interested`
                    : (event.social?.friendsGoing || 0) > 0
                    ? `${event.social?.friendsGoing} friend${(event.social?.friendsGoing || 0) > 1 ? 's' : ''} going`
                    : `${event.social?.friendsInterested} friend${(event.social?.friendsInterested || 0) > 1 ? 's' : ''} interested`
                  }
                </>
              )}
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
  };

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
          ✨ Almost Plans
        </h2>
      </button>
      
      {/* Content - Hidden when collapsed on mobile */}
      <div className={`${collapsed ? 'hidden lg:block' : 'block'}`}>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm mb-2">No friend activity yet.</p>
            <p className="text-xs">Add friends to see what they're interested in.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hot Leads: <2 weeks + mutual interest */}
            {hotLeads.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
                  <span>🔥</span>
                  Ready to Coordinate
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {hotLeads.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {hotLeads.map(event => renderEventCard(event, true))}
                </div>
              </div>
            )}

            {/* Soon Events: <2 weeks, no user interest yet */}
            {soonEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span>⏰</span>
                  Coming Soon
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {soonEvents.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {soonEvents.map(event => renderEventCard(event))}
                </div>
              </div>
            )}

            {/* Later Events: >2 weeks */}
            {laterEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span>📅</span>
                  Later
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {laterEvents.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {laterEvents.map(event => renderEventCard(event))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
