'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { SquadPageModal } from './squad/SquadPageModal';
import { SquadCreationModal } from './squad/SquadCreationModal';

interface SmartSquadButtonProps {
  eventId: string;
  userSquadId?: string | null; // Pre-fetched squad ID
  friendsGoing?: number; // Number of friends going
  friendsInterested?: number; // Number of friends interested  
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
  alwaysShow?: boolean; // Always show button regardless of friends (for Social tab)
}

// Hook to detect mobile (< 768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
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
  const isMobile = useIsMobile();
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [currentSquadId, setCurrentSquadId] = useState(userSquadId);

  const hasSquad = !!currentSquadId;
  const totalFriends = friendsGoing + friendsInterested;
  
  // Show button if: alwaysShow is true, OR friends interested/going, OR user already has a squad
  const shouldShow = alwaysShow || hasSquad || totalFriends > 0;
  
  if (!shouldShow) {
    return null; // Don't render anything
  }

  const handleClick = () => {
    if (currentSquadId) {
      // User has existing squad
      if (isMobile) {
        // Mobile: Navigate directly to squad page
        router.push(`/squads/${currentSquadId}`);
      } else {
        // Desktop: Show modal (with link to full page)
        setShowSquadModal(true);
      }
    } else {
      // No existing squad - show creation modal (same on both)
      setShowCreationModal(true);
    }
  };

  const handleSquadCreated = (squadId: string) => {
    setCurrentSquadId(squadId);
    if (isMobile) {
      // Mobile: Navigate directly to new squad
      router.push(`/squads/${squadId}`);
    } else {
      // Desktop: Show modal
      setShowSquadModal(true);
    }
  };

  // Title Case for CTAs - human language, no jargon
  const buttonText = hasSquad ? 'View Plan' : 'Start Plan';

  // Default event object if not provided (for compatibility)
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
    ? 'text-[var(--action-engage-text)] bg-[var(--action-engage)] border-[var(--action-engage)] hover:bg-[var(--action-engage-hover)]'
    : 'text-[var(--action-engage)] bg-transparent border-[var(--action-engage)] hover:bg-[var(--action-engage-light)]';

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

      {/* Squad Modal - Desktop only, full squad experience */}
      {showSquadModal && currentSquadId && !isMobile && (
        <SquadPageModal
          squadId={currentSquadId}
          isOpen={showSquadModal}
          onClose={() => setShowSquadModal(false)}
        />
      )}

      {/* Squad Creation Modal - Both platforms */}
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
