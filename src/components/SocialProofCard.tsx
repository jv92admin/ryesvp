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
}

export function SocialProofCard({
  eventId,
  socialSignals,
  attendance,
  userSquad,
  event,
  isLoggedIn,
}: SocialProofCardProps) {
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

  if (totalFriends === 0 && !userSquad) return null;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Friends */}
        {totalFriends > 0 && (
          <button
            onClick={() => setShowFriendsModal(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FriendAvatarStack friends={friendsForAvatars} maxVisible={3} size="sm" />
            <span className="text-sm text-[var(--text-primary)]">
              {friendsGoing > 0 && <><strong>{friendsGoing}</strong> going</>}
              {friendsGoing > 0 && friendsInterested > 0 && <span className="text-[var(--text-muted)]"> · </span>}
              {friendsInterested > 0 && <><strong>{friendsInterested}</strong> interested</>}
            </span>
          </button>
        )}

        {/* Plan link */}
        {isLoggedIn && (
          <SmartSquadButton
            eventId={eventId}
            userSquadId={userSquad?.id || null}
            friendsGoing={friendsGoing}
            friendsInterested={friendsInterested}
            event={event}
            alwaysShow={totalFriends > 0}
          />
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
