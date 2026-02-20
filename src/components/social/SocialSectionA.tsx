'use client';

import { useState } from 'react';
import { EventDisplay } from '@/db/events';
import { SocialEventCard } from './SocialEventCard';
import { CombinedAttendanceModal } from '../CombinedAttendanceModal';

interface SocialSectionAProps {
  events: EventDisplay[];
  recentSquadIds?: string[]; // Squad IDs with unread ADDED_TO_PLAN notifications
}

export function SocialSectionA({ events, recentSquadIds = [] }: SocialSectionAProps) {
  const [modalEventId, setModalEventId] = useState<string | null>(null);

  // Group events: recent squads first (based on unread notifications), then time buckets
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  // Events with unread notifications show at top
  const recentSquadEvents = events.filter(event => {
    const squadId = (event as any).userSquad?.id;
    return squadId &&
      recentSquadIds.includes(squadId) &&
      new Date(event.startDateTime) >= new Date();
  });

  // All other events go in regular sections
  const nonRecentEvents = events.filter(event => {
    const squadId = (event as any).userSquad?.id;
    return !squadId || !recentSquadIds.includes(squadId);
  });

  const soonEvents = nonRecentEvents.filter(event => new Date(event.startDateTime) <= twoWeeksOut);
  const laterEvents = nonRecentEvents.filter(event => new Date(event.startDateTime) > twoWeeksOut);

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
            <p className="text-sm mb-2">You haven&apos;t made any plans yet.</p>
            <p className="text-xs">Mark events as &quot;Going&quot; or start a plan to see them here.</p>
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
                    <SocialEventCard event={event} highlighted onAvatarClick={setModalEventId} />
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
                    <SocialEventCard event={event} onAvatarClick={setModalEventId} />
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
