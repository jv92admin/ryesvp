'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  variant = 'default'
}: SmartSquadButtonProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [currentSquadId, setCurrentSquadId] = useState(userSquadId);

  const hasSquad = !!currentSquadId;
  const totalFriends = friendsGoing + friendsInterested;
  
  // Only show "Go Together" if there are friends interested/going OR user already has a squad
  const shouldShow = hasSquad || totalFriends > 0;
  
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

  // Clean button text - no friend context clutter
  const buttonText = hasSquad ? 'View Squad' : 'Go Together';
  const buttonIcon = hasSquad ? '👥' : '✨';

  const baseClasses = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2";
  
  const variantClasses = variant === 'compact' 
    ? "px-3 py-1.5 text-sm bg-purple-600 text-white hover:bg-purple-700"
    : "px-4 py-2 bg-purple-600 text-white hover:bg-purple-700";

  // Default event object if not provided (for compatibility)
  const eventData = event || {
    id: eventId,
    title: 'Event',
    startDateTime: new Date().toISOString(),
    venue: { name: 'Venue' }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        <span className="mr-1">{buttonIcon}</span>
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
