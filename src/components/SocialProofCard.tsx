'use client';

import { useState } from 'react';
import { EventDetailedSocial } from '@/db/events';
import { SquadCreationModal } from './squad/SquadCreationModal';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { FriendAvatarStack } from './ui/FriendAvatarStack';
import { getDisplayName } from '@/lib/avatar';

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
  const [showCreation, setShowCreation] = useState(false);

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

  // Build friend names for the subtitle
  const friendNames = [
    ...(socialSignals?.friends.filter(f => f.status === 'GOING') || []),
    ...(socialSignals?.friends.filter(f => f.status === 'INTERESTED') || []),
  ].slice(0, 3).map(f => getDisplayName(f.displayName, f.email).split(' ')[0]);

  const friendSubtitle = friendNames.length > 0
    ? `Coordinate with ${friendNames.join(', ')}${totalFriends > 3 ? ` & ${totalFriends - 3} other${totalFriends - 3 !== 1 ? 's' : ''}` : ''}`
    : null;

  // When user has a plan, social proof is minimal (plan panel handles the rest)
  const hasSquad = !!userSquad;

  // Nothing to show if no friends and no squad
  if (totalFriends === 0 && !hasSquad) return null;

  return (
    <>
      <div className="mb-6">
        {/* Friend avatars + counts */}
        {totalFriends > 0 && (
          <button
            onClick={() => setShowFriendsModal(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-4"
          >
            <FriendAvatarStack friends={friendsForAvatars} maxVisible={3} size="sm" />
            <span className="text-sm text-[var(--text-primary)]">
              {friendsGoing > 0 && <><strong>{friendsGoing}</strong> going</>}
              {friendsGoing > 0 && friendsInterested > 0 && <span className="text-[var(--text-muted)]"> &middot; </span>}
              {friendsInterested > 0 && <><strong>{friendsInterested}</strong> interested</>}
            </span>
          </button>
        )}

        {/* State B: Full-width Start Plan CTA (only when friends going + no squad) */}
        {isLoggedIn && !hasSquad && totalFriends > 0 && (
          <div>
            <button
              onClick={() => setShowCreation(true)}
              className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-[var(--action-engage)] text-[var(--action-engage-text)] hover:bg-[var(--action-engage-hover)] transition-colors"
            >
              Start Plan
            </button>
            {friendSubtitle && (
              <p className="text-xs text-[var(--text-muted)] text-center mt-1.5">
                {friendSubtitle}
              </p>
            )}
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

      {showCreation && (
        <SquadCreationModal
          event={event}
          isOpen={showCreation}
          onClose={() => setShowCreation(false)}
          onSquadCreated={() => {
            setShowCreation(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
