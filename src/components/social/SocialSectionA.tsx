'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { EventDisplay } from '@/db/events';
import { getViewedSquadIds } from '@/lib/squadNotifications';
import { SmartSquadButton } from '../SmartSquadButton';
import { StatusBadge, FriendCountBadge } from '../ui/StatusBadge';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SocialSectionAProps {
  events: EventDisplay[];
}

export function SocialSectionA({ events }: SocialSectionAProps) {
  // Group events: recent squads first, then time buckets
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
  
  // Get viewed squad IDs to filter out viewed squads
  const viewedSquadIds = getViewedSquadIds();
  
  const recentSquadEvents = events.filter(event => 
    event.isRecentSquadAddition && 
    new Date(event.startDateTime) >= new Date() &&
    // Check both squad ID and event ID for compatibility (in case event ID was stored by mistake)
    !viewedSquadIds.includes((event as any).userSquad?.id) && 
    !viewedSquadIds.includes(event.id)
  );
  
  // Include non-recent events AND viewed recent events (so they appear in regular sections)
  const nonRecentEvents = events.filter(event => 
    !event.isRecentSquadAddition || 
    (event.isRecentSquadAddition && 
     (viewedSquadIds.includes((event as any).userSquad?.id) || viewedSquadIds.includes(event.id)))
  );
  
  const soonEvents = nonRecentEvents.filter(event => new Date(event.startDateTime) <= twoWeeksOut);
  const laterEvents = nonRecentEvents.filter(event => new Date(event.startDateTime) > twoWeeksOut);

  const renderEventCard = (event: EventDisplay, isInvite = false) => (
    <div className={`px-4 py-3 hover:bg-gray-50 transition-colors ${isInvite ? 'bg-[var(--brand-primary-light)]/50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Image */}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.displayTitle}
            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
          />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/events/${event.id}`} className="hover:text-[var(--brand-primary)]">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
              {event.displayTitle}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')} • {event.venue.name}
          </p>
          
          {/* Status + Plan button row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={event.social?.userStatus} />
              <FriendCountBadge 
                goingCount={event.social?.friendsGoing} 
                interestedCount={event.social?.friendsInterested}
                variant="text"
              />
            </div>
            
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
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-fit">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-wide">
          Your plans
        </h2>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-gray-100">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <p className="text-sm mb-2">You haven't made any plans yet.</p>
            <p className="text-xs">Mark events as "Going" or start a plan to see them here.</p>
          </div>
        ) : (
          <>
            {/* New plan invites - highlighted */}
            {recentSquadEvents.length > 0 && (
              <div className="bg-[var(--brand-primary-light)]/30">
                <div className="px-4 py-2 border-b border-green-200">
                  <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide">
                    New invites ({recentSquadEvents.length})
                  </span>
                </div>
                {recentSquadEvents.map((event, idx) => (
                  <div key={event.id} className={idx < recentSquadEvents.length - 1 ? 'border-b-2 border-green-200' : ''}>
                    {renderEventCard(event, true)}
                  </div>
                ))}
              </div>
            )}

            {/* Soon Events (<14 days) */}
            {soonEvents.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Coming up ({soonEvents.length})
                  </span>
                </div>
                {soonEvents.map((event, idx) => (
                  <div key={event.id} className={idx < soonEvents.length - 1 ? 'border-b border-gray-100' : ''}>
                    {renderEventCard(event, false)}
                  </div>
                ))}
              </div>
            )}

            {/* Later Events (>14 days) */}
            {laterEvents.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Later ({laterEvents.length})
                  </span>
                </div>
                {laterEvents.map((event, idx) => (
                  <div key={event.id} className={idx < laterEvents.length - 1 ? 'border-b border-gray-100' : ''}>
                    {renderEventCard(event, false)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
