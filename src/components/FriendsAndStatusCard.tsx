'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { EventDetailedSocial } from '@/db/events';
import { SmartSquadButton } from './SmartSquadButton';
import { CombinedAttendanceModal } from './CombinedAttendanceModal';
import { FriendAvatarStack } from './ui/FriendAvatarStack';
import { useEngagementToast } from './EngagementToast';
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
  const [ticketStatus, setTicketStatus] = useState<'NEED_TICKETS' | 'HAVE_TICKETS' | null>(
    userEvent?.status === 'NEED_TICKETS' || userEvent?.status === 'HAVE_TICKETS' 
      ? userEvent.status 
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  
  // Local attendance counts for optimistic updates
  const [localAttendance, setLocalAttendance] = useState(attendance);

  // Toast for first engagement
  const { showToast, ToastComponent } = useEngagementToast();

  // Calculate friends going/interested
  const friendsGoing = socialSignals?.friends.filter(f => f.status === 'GOING').length || 0;
  const friendsInterested = socialSignals?.friends.filter(f => f.status === 'INTERESTED').length || 0;
  const totalFriends = friendsGoing + friendsInterested;

  // Handle attendance status change (Interested/Going)
  const handleAttendanceChange = async (newStatus: 'INTERESTED' | 'GOING') => {
    const previousStatus = status;
    setIsLoading(true);
    
    // Optimistic update
    if (status === newStatus) {
      setStatus(null);
      setLocalAttendance(prev => ({
        ...prev,
        going: newStatus === 'GOING' ? Math.max(0, prev.going - 1) : prev.going,
        interested: newStatus === 'INTERESTED' ? Math.max(0, prev.interested - 1) : prev.interested,
      }));
    } else {
      setStatus(newStatus);
      setLocalAttendance(prev => ({
        ...prev,
        going: newStatus === 'GOING' 
          ? prev.going + 1 
          : (previousStatus === 'GOING' ? Math.max(0, prev.going - 1) : prev.going),
        interested: newStatus === 'INTERESTED' 
          ? prev.interested + 1 
          : (previousStatus === 'INTERESTED' ? Math.max(0, prev.interested - 1) : prev.interested),
      }));
    }
    
    try {
      if (previousStatus === newStatus) {
        await fetch(`/api/events/${eventId}/attendance`, { method: 'DELETE' });
      } else {
        const res = await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          setStatus(previousStatus);
          setLocalAttendance(attendance);
        } else if (previousStatus === null) {
          // First engagement - show toast
          showToast();
        }
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setStatus(previousStatus);
      setLocalAttendance(attendance);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ticket status change (Need/Selling) - separate from attendance
  const handleTicketChange = async (newTicketStatus: 'NEED_TICKETS' | 'HAVE_TICKETS') => {
    const previousTicket = ticketStatus;
    setIsLoading(true);
    
    // Toggle off if same
    const nextTicket = ticketStatus === newTicketStatus ? null : newTicketStatus;
    setTicketStatus(nextTicket);
    
    try {
      if (nextTicket === null) {
        // Just remove ticket status, keep attendance
        // For now, we'll just update locally - API could be extended later
      } else {
        // Set ticket status
        await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextTicket }),
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setTicketStatus(previousTicket);
    } finally {
      setIsLoading(false);
    }
  };

  // Get friends for avatar display
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

  return (
    <div className="bg-white rounded-lg border border-[var(--border-default)] p-4 sm:p-5 mb-6">
      <div className="space-y-2">
        {/* ROW 1: Attendance (PRIMARY) - Interested / Going */}
        <div className="grid grid-cols-2 gap-1.5">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => handleAttendanceChange('INTERESTED')}
                disabled={isLoading}
                className={`
                  px-3 py-2 rounded-md font-medium transition-colors text-[13px]
                  ${status === 'INTERESTED'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                ★ Interested
              </button>
              <button
                onClick={() => handleAttendanceChange('GOING')}
                disabled={isLoading}
                className={`
                  px-3 py-2 rounded-md font-medium transition-colors text-[13px]
                  ${status === 'GOING'
                    ? 'bg-[var(--signal-going)] text-white hover:bg-[var(--signal-going-hover)]'
                    : 'bg-white border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                ✓ Going
              </button>
            </>
          ) : (
            <>
              <button disabled className="px-3 py-2 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed text-[13px]">
                ★ Interested
              </button>
              <button disabled className="px-3 py-2 border border-gray-200 rounded-md text-gray-400 cursor-not-allowed text-[13px]">
                ✓ Going
              </button>
            </>
          )}
        </div>

        {/* ROW 2: Planning strip (SECONDARY) - Friends + Start Plan */}
        {isLoggedIn && (
          <div className="flex items-center justify-between gap-3">
            {/* Left: Friend avatars */}
            {totalFriends > 0 ? (
              <button
                onClick={() => setShowFriendsModal(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <FriendAvatarStack
                  friends={friendsForAvatars}
                  maxVisible={4}
                  size="md"
                />
                <span className="text-xs text-gray-500">
                  {totalFriends} friend{totalFriends !== 1 ? 's' : ''}
                </span>
              </button>
            ) : (
              <span className="text-[13px] text-gray-400">
                No friends marked yet
              </span>
            )}
            
            {/* Right: Start Plan */}
            <SmartSquadButton
              eventId={eventId}
              userSquadId={userSquad?.id || null}
              friendsGoing={friendsGoing}
              friendsInterested={friendsInterested}
              event={event}
              alwaysShow={true}
              className="justify-center py-2 text-[13px] rounded-md"
            />
          </div>
        )}

        {/* ROW 3: Ticket status (TERTIARY) - separated, lighter colors */}
        {isLoggedIn && (
          <>
            {/* Subtle separator */}
            <div className="border-t border-gray-100 my-1" />
            
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleTicketChange('NEED_TICKETS')}
                disabled={isLoading}
                className={`
                  px-3 py-2 rounded-md text-[13px] font-medium transition-colors
                  ${ticketStatus === 'NEED_TICKETS'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
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
                  px-3 py-2 rounded-md text-[13px] font-medium transition-colors
                  ${ticketStatus === 'HAVE_TICKETS'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Selling Tickets
              </button>
            </div>
          </>
        )}

        {/* Sign in prompt for non-logged in users */}
        {!isLoggedIn && (
          <p className="text-xs text-gray-500 text-center pt-1">
            <Link href="/login" className="text-[var(--signal-info)] hover:underline">
              Sign in
            </Link> to mark your status
          </p>
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

      {/* First engagement toast */}
      {ToastComponent}
    </div>
  );
}
