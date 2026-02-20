'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { SmartSquadButton } from './SmartSquadButton';

interface EventCardActionsProps {
  eventId: string;
  userStatus?: AttendanceStatus | null;
  userSquadId?: string | null;
  friendsGoing?: number;
  friendsInterested?: number;
  event: {
    id: string;
    title: string;
    startDateTime: string;
    venue: { name: string };
  };
}

export function EventCardActions({
  eventId,
  userStatus,
  userSquadId,
  friendsGoing = 0,
  friendsInterested = 0,
  event,
}: EventCardActionsProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(userStatus || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusClick = async (newStatus: AttendanceStatus) => {
    setIsLoading(true);
    try {
      if (status === newStatus) {
        // Toggle off
        await fetch(`/api/events/${eventId}/attendance`, { method: 'DELETE' });
        setStatus(null);
      } else {
        // Set new status
        const res = await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setStatus(newStatus);
        }
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // User has expressed interest OR has a squad → show Start Plan
  const showStartPlan = status || userSquadId;

  return (
    <div className="flex items-center gap-1.5">
      {/* Going button - checkmark */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStatusClick('GOING');
        }}
        disabled={isLoading}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center transition-colors
          ${status === 'GOING'
            ? 'bg-[var(--signal-going)] text-white'
            : 'bg-gray-100 text-[var(--text-muted)] hover:bg-gray-200'
          }
          disabled:opacity-50
        `}
        title="Going"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Interested button - star */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStatusClick('INTERESTED');
        }}
        disabled={isLoading}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center transition-colors
          ${status === 'INTERESTED' 
            ? 'bg-amber-500 text-white' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }
          disabled:opacity-50
        `}
        title="Interested"
      >
        <svg className="w-4 h-4" fill={status === 'INTERESTED' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>

      {/* Start Plan button - only shows after user expresses interest */}
      {showStartPlan && (
        <SmartSquadButton
          eventId={eventId}
          userSquadId={userSquadId}
          friendsGoing={friendsGoing}
          friendsInterested={friendsInterested}
          event={event}
          variant="compact"
          alwaysShow={true}
        />
      )}
    </div>
  );
}

