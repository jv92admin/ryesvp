'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SquadCreationModal } from './squad/SquadCreationModal';

interface SmartSquadButtonProps {
  eventId: string;
  userSquadId?: string | null;
  friendsGoing?: number;
  friendsInterested?: number;
  event?: {
    id: string;
    title: string;
    startDateTime: string;
    venue: {
      name: string;
    };
  };
  className?: string;
  variant?: 'default' | 'compact';
  alwaysShow?: boolean;
}

export function SmartSquadButton({
  eventId,
  userSquadId = null,
  friendsGoing = 0,
  friendsInterested = 0,
  event,
  className = "",
  variant = 'default',
  alwaysShow = false
}: SmartSquadButtonProps) {
  const router = useRouter();
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [currentSquadId, setCurrentSquadId] = useState(userSquadId);

  const hasSquad = !!currentSquadId;
  const totalFriends = friendsGoing + friendsInterested;

  const shouldShow = alwaysShow || hasSquad || totalFriends > 0;

  if (!shouldShow) {
    return null;
  }

  const handleClick = () => {
    if (currentSquadId) {
      // Navigate to event page with Plan tab open
      router.push(`/events/${eventId}?tab=plan`);
    } else {
      setShowCreationModal(true);
    }
  };

  const handleSquadCreated = (squadId: string) => {
    setCurrentSquadId(squadId);
    // Navigate to event page with Plan tab open
    router.push(`/events/${eventId}?tab=plan`);
  };

  const buttonText = hasSquad ? 'View Plan' : 'Start Plan';

  const eventData = event || {
    id: eventId,
    title: 'Event',
    startDateTime: new Date().toISOString(),
    venue: { name: 'Venue' }
  };

  const isCompact = variant === 'compact';
  const sizeStyles = isCompact
    ? 'min-w-[5.5rem] px-2.5 py-1.5 text-xs font-semibold rounded-md'
    : 'px-4 py-2 text-sm font-medium rounded-lg';
  const colorStyles = isCompact
    ? 'text-[var(--text-inverse)] bg-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accent-hover)]'
    : 'text-[var(--lark-text-primary)] bg-transparent border-[var(--border-visible)] hover:bg-[var(--bg-hover)]';

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          ${sizeStyles} ${colorStyles}
          border transition-colors
          ${className}
        `}
      >
        {buttonText}
      </button>

      {showCreationModal && (
        <SquadCreationModal
          event={eventData}
          isOpen={showCreationModal}
          onClose={() => setShowCreationModal(false)}
          onSquadCreated={handleSquadCreated}
        />
      )}
    </>
  );
}
