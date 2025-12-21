'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { EventDisplay } from '@/db/events';
import { SmartSquadButton } from '../SmartSquadButton';
import { FriendAvatarStack } from '../ui/FriendAvatarStack';
import { CombinedAttendanceModal } from '../CombinedAttendanceModal';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SocialSectionBProps {
  events: EventDisplay[];
}

export function SocialSectionB({ events }: SocialSectionBProps) {
  const [modalEventId, setModalEventId] = useState<string | null>(null);
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
    return (
      <div className={`px-4 py-3 hover:bg-gray-50 transition-colors ${isHotLead ? 'bg-[var(--brand-primary-light)]/50' : ''}`}>
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
            
            {/* Friend avatars + Plan button row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const friendsList = [
                    ...((event as any).friendsGoing || []),
                    ...((event as any).friendsInterested || []),
                  ].slice(0, 5).map((f: any) => ({
                    id: f.userId,
                    displayName: f.displayName,
                    email: f.email,
                  }));
                  return friendsList.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setModalEventId(event.id);
                      }}
                      className="flex items-center hover:opacity-80 transition-opacity"
                    >
                      <FriendAvatarStack
                        friends={friendsList}
                        maxVisible={3}
                        size="sm"
                      />
                    </button>
                  ) : null;
                })()}
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
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-fit">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-wide">
          Friends' plans
        </h2>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-gray-100">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <p className="text-sm mb-2">No friend activity yet.</p>
            <p className="text-xs">Add friends to see what they're interested in.</p>
          </div>
        ) : (
          <>
            {/* Hot Leads - highlighted */}
            {hotLeads.length > 0 && (
              <div className="bg-[var(--brand-primary-light)]/30">
                <div className="px-4 py-2 border-b border-green-200">
                  <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide">
                    Ready to coordinate ({hotLeads.length})
                  </span>
                </div>
                {hotLeads.map((event, idx) => (
                  <div key={event.id} className={idx < hotLeads.length - 1 ? 'border-b-2 border-green-200' : ''}>
                    {renderEventCard(event, true)}
                  </div>
                ))}
              </div>
            )}

            {/* Soon Events */}
            {soonEvents.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Coming soon ({soonEvents.length})
                  </span>
                </div>
                {soonEvents.map((event, idx) => (
                  <div key={event.id} className={idx < soonEvents.length - 1 ? 'border-b border-gray-100' : ''}>
                    {renderEventCard(event)}
                  </div>
                ))}
              </div>
            )}

            {/* Later Events */}
            {laterEvents.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Later ({laterEvents.length})
                  </span>
                </div>
                {laterEvents.map((event, idx) => (
                  <div key={event.id} className={idx < laterEvents.length - 1 ? 'border-b border-gray-100' : ''}>
                    {renderEventCard(event)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Friends modal */}
      {modalEventId && (
        <CombinedAttendanceModal
          eventId={modalEventId}
          goingCount={events.find(e => e.id === modalEventId)?.social?.friendsGoing || 0}
          interestedCount={events.find(e => e.id === modalEventId)?.social?.friendsInterested || 0}
          onClose={() => setModalEventId(null)}
        />
      )}
    </div>
  );
}
