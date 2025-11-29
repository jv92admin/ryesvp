'use client';

import { useState, useEffect } from 'react';
import { SquadModal } from './squad/SquadModal';
import { SquadCreationModal } from './squad/SquadCreationModal';

interface GoTogetherButtonProps {
  eventId: string;
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

export function GoTogetherButton({ 
  eventId, 
  event,
  className = "", 
  variant = 'default' 
}: GoTogetherButtonProps) {
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [userSquadId, setUserSquadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user already has a squad for this event
  useEffect(() => {
    async function checkExistingSquad() {
      setLoading(true);
      try {
        const response = await fetch(`/api/events/${eventId}/squad`);
        if (response.ok) {
          const data = await response.json();
          setUserSquadId(data.hasSquad ? data.squadId : null);
        } else {
          // If not authenticated, assume no squad
          setUserSquadId(null);
        }
      } catch (error) {
        console.error('Error checking existing squad:', error);
        setUserSquadId(null);
      } finally {
        setLoading(false);
      }
    }

    checkExistingSquad();
  }, [eventId]);

  const handleClick = () => {
    if (userSquadId) {
      // User has existing squad - show squad modal
      setShowSquadModal(true);
    } else {
      // No existing squad - show creation modal
      setShowCreationModal(true);
    }
  };

  const handleSquadCreated = (squadId: string) => {
    setUserSquadId(squadId);
    setShowSquadModal(true);
  };

  const buttonText = loading ? 'Loading...' : (userSquadId ? 'View Squad' : 'Go Together');
  const buttonIcon = loading ? '⏳' : (userSquadId ? '👥' : '✨');

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
        disabled={loading}
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        <span className="flex items-center gap-1.5">
          <span>{buttonIcon}</span>
          <span>{buttonText}</span>
        </span>
      </button>

      {/* Squad Creation Modal - for new squads */}
      <SquadCreationModal
        event={eventData}
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSquadCreated={handleSquadCreated}
      />

      {/* Squad Modal - for existing squads */}
      <SquadModal
        squadId={userSquadId}
        eventId={userSquadId ? undefined : eventId}
        isOpen={showSquadModal}
        onClose={() => setShowSquadModal(false)}
      />
    </>
  );
}
