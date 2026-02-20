'use client';

import { useState } from 'react';
import { EventDetailedSocial } from '@/db/events';
import { SmartSquadButton } from './SmartSquadButton';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { FriendAvatarStack } from './ui/FriendAvatarStack';

interface SocialProofCardProps {
  eventId: string;
  socialSignals: EventDetailedSocial | null;
  attendance: {
    going: number;
    interested: number;
    needTickets: number;
    haveTickets: number;
  };
  userSquad: { id: string } | null;
  event: {
    id: string;
    title: string;
    startDateTime: string;
    venue: { name: string };
  };
  isLoggedIn: boolean;
  initialTicketStatus?: string | null;
}

export function SocialProofCard({
  eventId,
  socialSignals,
  attendance,
  userSquad,
  event,
  isLoggedIn,
  initialTicketStatus,
}: SocialProofCardProps) {
  const [ticketStatus, setTicketStatus] = useState<'NEED_TICKETS' | 'HAVE_TICKETS' | null>(
    initialTicketStatus === 'NEED_TICKETS' || initialTicketStatus === 'HAVE_TICKETS'
      ? initialTicketStatus
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const friendsGoing = socialSignals?.friends.filter(f => f.status === 'GOING').length || 0;
  const friendsInterested = socialSignals?.friends.filter(f => f.status === 'INTERESTED').length || 0;
  const totalFriends = friendsGoing + friendsInterested;

  const friendsForAvatars = [
    ...(socialSignals?.friends.filter(f => f.status === 'GOING') || []).map(f => ({
      id: f.id,
      displayName: f.displayName,
      email: f.email,
    })),
    ...(socialSignals?.friends.filter(f => f.status === 'INTERESTED') || []).map(f => ({
      id: f.id,
      displayName: f.displayName,
      email: f.email,
    })),
  ].slice(0, 5);

  const handleTicketChange = async (newTicketStatus: 'NEED_TICKETS' | 'HAVE_TICKETS') => {
    const previous = ticketStatus;
    setIsLoading(true);
    const next = ticketStatus === newTicketStatus ? null : newTicketStatus;
    setTicketStatus(next);

    try {
      if (next !== null) {
        await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
      }
    } catch {
      setTicketStatus(previous);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn && totalFriends === 0) return null;

  const ticketText = 'text-sm transition-colors disabled:opacity-50';
  const ticketInactive = 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]';

  return (
    <>
      <div className="mb-6 border-t border-[var(--border-default)]">
        {/* Friends row */}
        {totalFriends > 0 && (
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => setShowFriendsModal(true)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <FriendAvatarStack friends={friendsForAvatars} maxVisible={3} size="md" />
              <span className="text-sm text-[var(--text-primary)]">
                {friendsGoing > 0 && <><strong>{friendsGoing}</strong> going</>}
                {friendsGoing > 0 && friendsInterested > 0 && ' · '}
                {friendsInterested > 0 && <><strong>{friendsInterested}</strong> interested</>}
              </span>
            </button>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              See all
            </button>
          </div>
        )}

        {/* Plan + Ticket row */}
        {isLoggedIn && (
          <div className="flex items-center gap-3 py-3 border-t border-[var(--border-default)]">
            <SmartSquadButton
              eventId={eventId}
              userSquadId={userSquad?.id || null}
              friendsGoing={friendsGoing}
              friendsInterested={friendsInterested}
              event={event}
              alwaysShow={true}
            />
            <span className="text-[var(--border-default)]" aria-hidden>|</span>
            <button
              onClick={() => handleTicketChange('NEED_TICKETS')}
              disabled={isLoading}
              className={`${ticketText} ${
                ticketStatus === 'NEED_TICKETS'
                  ? 'font-medium text-[var(--signal-interested)]'
                  : ticketInactive
              }`}
            >
              Need Tickets
            </button>
            <button
              onClick={() => handleTicketChange('HAVE_TICKETS')}
              disabled={isLoading}
              className={`${ticketText} ${
                ticketStatus === 'HAVE_TICKETS'
                  ? 'font-medium text-[var(--action-engage)]'
                  : ticketInactive
              }`}
            >
              Selling
            </button>
          </div>
        )}
      </div>

      {showFriendsModal && (
        <CombinedAttendanceModal
          eventId={eventId}
          goingCount={attendance.going}
          interestedCount={attendance.interested}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </>
  );
}
