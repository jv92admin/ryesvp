'use client';

import { useState } from 'react';
import { EventDisplay } from '@/db/events';
import { SocialEventCard } from './SocialEventCard';
import { CombinedAttendanceModal } from '../CombinedAttendanceModal';

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
    return new Date(event.startDateTime) > twoWeeksOut;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-fit">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-wide">
          Friends&apos; plans
        </h2>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <p className="text-sm mb-2">No friend activity yet.</p>
            <p className="text-xs">Add friends to see what they&apos;re interested in.</p>
          </div>
        ) : (
          <>
            {/* Hot Leads - highlighted */}
            {hotLeads.length > 0 && (
              <div className="bg-[var(--brand-primary-light)]/30">
                <div className="px-4 py-2 border-b border-[var(--border-default)]">
                  <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide">
                    Ready to coordinate ({hotLeads.length})
                  </span>
                </div>
                {hotLeads.map((event, idx) => (
                  <div key={event.id} className={idx < hotLeads.length - 1 ? 'border-b-2 border-[var(--border-default)]' : ''}>
                    <SocialEventCard event={event} highlighted onAvatarClick={setModalEventId} />
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
                    <SocialEventCard event={event} onAvatarClick={setModalEventId} />
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
                    <SocialEventCard event={event} onAvatarClick={setModalEventId} />
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
