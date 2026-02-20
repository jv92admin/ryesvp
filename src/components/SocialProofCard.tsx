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

  // Don't render if logged out and no public social signals
  if (!isLoggedIn && totalFriends === 0) return null;

  return (
    <div className="bg-[var(--surface-card)] rounded-lg border border-[var(--border-default)] p-4 sm:p-5 mb-6">
      <div className="space-y-3">
        {/* Friend avatars + count */}
        {totalFriends > 0 ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFriendsModal(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <FriendAvatarStack friends={friendsForAvatars} maxVisible={4} size="md" />
              <span className="text-sm text-[var(--text-secondary)]">
                {friendsGoing > 0 && `${friendsGoing} going`}
                {friendsGoing > 0 && friendsInterested > 0 && ' · '}
                {friendsInterested > 0 && `${friendsInterested} interested`}
              </span>
            </button>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              See all
            </button>
          </div>
        ) : isLoggedIn ? (
          <p className="text-sm text-[var(--text-muted)]">No friends marked yet</p>
        ) : null}

        {/* Plan button */}
        {isLoggedIn && (
          <SmartSquadButton
            eventId={eventId}
            userSquadId={userSquad?.id || null}
            friendsGoing={friendsGoing}
            friendsInterested={friendsInterested}
            event={event}
            alwaysShow={true}
            className="justify-center py-2 text-sm rounded-lg"
          />
        )}

        {/* Ticket exchange */}
        {isLoggedIn && (
          <>
            <div className="border-t border-[var(--border-default)] pt-3">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Ticket Exchange</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTicketChange('NEED_TICKETS')}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${ticketStatus === 'NEED_TICKETS'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  Need Tickets
                </button>
                <button
                  onClick={() => handleTicketChange('HAVE_TICKETS')}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${ticketStatus === 'HAVE_TICKETS'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  Selling Tickets
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Friends modal */}
      {showFriendsModal && (
        <CombinedAttendanceModal
          eventId={eventId}
          goingCount={attendance.going}
          interestedCount={attendance.interested}
          onClose={() => setShowFriendsModal(false)}
        />
      )}
    </div>
  );
}
