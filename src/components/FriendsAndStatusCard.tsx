'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { EventDetailedSocial } from '@/db/events';
import { SmartSquadButton } from './SmartSquadButton';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import Link from 'next/link';

interface FriendsAndStatusCardProps {
  eventId: string;
  socialSignals: EventDetailedSocial | null;
  attendance: {
    going: number;
    interested: number;
    needTickets: number;
    haveTickets: number;
  };
  userEvent: {
    status: AttendanceStatus | null;
    comment: string | null;
  } | null;
  userSquad: {
    id: string;
  } | null;
  event: {
    id: string;
    title: string;
    startDateTime: string;
    venue: {
      name: string;
    };
  };
  isLoggedIn: boolean;
}

const STATUS_CONFIG = {
  INTERESTED: {
    label: '★ Interested',
    activeClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  GOING: {
    label: '✓ Going',
    activeClass: 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
  },
  NEED_TICKETS: {
    label: '🎫 Need Tickets',
    activeClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  HAVE_TICKETS: {
    label: '🎟️ Have Tickets',
    activeClass: 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
  },
} as const;

export function FriendsAndStatusCard({
  eventId,
  socialSignals,
  attendance,
  userEvent,
  userSquad,
  event,
  isLoggedIn,
}: FriendsAndStatusCardProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(userEvent?.status || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Format friends going summary
  const formatFriendsSummary = () => {
    if (!socialSignals || socialSignals.friends.length === 0) {
      return null;
    }

    const friendsGoing = socialSignals.friends.filter(f => f.status === 'GOING');
    const friendsInterested = socialSignals.friends.filter(f => f.status === 'INTERESTED');

    if (friendsGoing.length === 0 && friendsInterested.length === 0) {
      return null;
    }

    // Show going first, then interested
    const displayFriends = friendsGoing.length > 0 ? friendsGoing : friendsInterested;
    const statusText = friendsGoing.length > 0 ? 'going' : 'interested';

    if (displayFriends.length === 1) {
      const friend = displayFriends[0];
      return {
        text: `${getDisplayName(friend.displayName, friend.email)} is ${statusText}`,
        avatars: [friend],
        count: 0,
      };
    } else if (displayFriends.length === 2) {
      return {
        text: `${getDisplayName(displayFriends[0].displayName, displayFriends[0].email)}, ${getDisplayName(displayFriends[1].displayName, displayFriends[1].email)} are ${statusText}`,
        avatars: displayFriends.slice(0, 2),
        count: 0,
      };
    } else {
      const firstTwo = displayFriends.slice(0, 2);
      const remaining = displayFriends.length - 2;
      return {
        text: `${getDisplayName(firstTwo[0].displayName, firstTwo[0].email)}, ${getDisplayName(firstTwo[1].displayName, firstTwo[1].email)} +${remaining} ${statusText}`,
        avatars: firstTwo,
        count: remaining,
      };
    }
  };

  const friendsSummary = formatFriendsSummary();

  const handleStatusChange = async (newStatus: AttendanceStatus) => {
    setIsLoading(true);
    try {
      if (status === newStatus) {
        // Toggle off - remove status
        await fetch(`/api/events/${eventId}/attendance`, {
          method: 'DELETE',
        });
        setStatus(null);
      } else {
        // Set new status
        await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            comment: userEvent?.comment || null,
          }),
        });
        setStatus(newStatus);
      }
      // Refresh the page to show updated counts
      window.location.reload();
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = (statusKey: keyof typeof STATUS_CONFIG) => {
    const config = STATUS_CONFIG[statusKey];
    const isActive = status === statusKey;
    
    return (
      <button
        onClick={() => handleStatusChange(statusKey)}
        disabled={isLoading || !isLoggedIn}
        className={`
          flex-1 px-2 py-1.5 rounded-lg font-medium transition-colors text-xs sm:text-sm
          ${isActive
            ? config.activeClass
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {config.label}
      </button>
    );
  };

  // Format attendance pill text
  const formatAttendancePill = () => {
    const parts: string[] = [];
    if (attendance.going > 0) {
      parts.push(`${attendance.going} ${attendance.going === 1 ? 'going' : 'going'}`);
    }
    if (attendance.interested > 0) {
      parts.push(`${attendance.interested} ${attendance.interested === 1 ? 'interested' : 'interested'}`);
    }
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const attendanceText = formatAttendancePill();
  const hasAttendance = attendance.going > 0 || attendance.interested > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      {/* Status toggles - 2x2 grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">What's your status?</h2>
          {hasAttendance && (
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors cursor-pointer"
            >
              {attendanceText}
            </button>
          )}
        </div>
        
        {isLoggedIn ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {renderButton('INTERESTED')}
              {renderButton('GOING')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {renderButton('NEED_TICKETS')}
              {renderButton('HAVE_TICKETS')}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                disabled
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-xs sm:text-sm"
              >
                ★ Interested
              </button>
              <button
                disabled
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-xs sm:text-sm"
              >
                ✓ Going
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-xs sm:text-sm"
              >
                🎫 Need Tickets
              </button>
              <button
                disabled
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-xs sm:text-sm"
              >
                🎟️ Have Tickets
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              <Link href="/login" className="text-[var(--brand-primary)] hover:underline">
                Sign in
              </Link> to mark your status
            </p>
          </>
        )}
      </div>

      {/* View Squad CTA - prominent, centered button between sections */}
      {isLoggedIn && (
        <div className="mb-6">
          <SmartSquadButton
            eventId={eventId}
            userSquadId={userSquad?.id || null}
            friendsGoing={socialSignals?.friends.filter(f => f.status === 'GOING').length || 0}
            friendsInterested={socialSignals?.friends.filter(f => f.status === 'INTERESTED').length || 0}
            event={event}
            className="w-full justify-center py-3 text-base"
          />
        </div>
      )}

      {/* Combined Attendance modal */}
      {showAttendanceModal && (
        <CombinedAttendanceModal
          eventId={eventId}
          goingCount={attendance.going}
          interestedCount={attendance.interested}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}
    </div>
  );
}

