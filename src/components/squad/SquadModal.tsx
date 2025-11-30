'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatInTimeZone } from 'date-fns-tz';
import { markSquadAsViewed } from '@/lib/squadNotifications';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import Link from 'next/link';

const AUSTIN_TIMEZONE = 'America/Chicago';

// Ticket status type (matches Prisma enum)
type TicketStatus = 'YES' | 'MAYBE' | 'NO' | 'COVERED';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: TicketStatus;
  coveredById: string | null;
  buyingForIds: string[];
  isOrganizer: boolean;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  eventId: string;
  createdById: string;
  meetTime: string | null;
  meetSpot: string | null;
  deadline: string | null;
  playlistUrl: string | null;
  event: {
    id: string;
    title: string;
    displayTitle: string;
    startDateTime: string;
    venue: {
      name: string;
    };
  };
  members: SquadMember[];
}

interface SquadModalProps {
  squadId: string | null;
  eventId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  IN: '✓ Going',
  THINKING: '? Maybe',
  OUT: '✗ Not going',
};

export function SquadModal({ squadId, eventId, isOpen, onClose }: SquadModalProps) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch squad data when modal opens
  useEffect(() => {
    if (!isOpen || !squadId) return;

    markSquadAsViewed(squadId);

    async function fetchSquad() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/squads/${squadId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load squad');
        }

        const data = await response.json();
        setSquad(data.squad);
        setCurrentUserId(data.currentUserId);
      } catch (err) {
        console.error('Error fetching squad:', err);
        setError(err instanceof Error ? err.message : 'Failed to load squad');
      } finally {
        setLoading(false);
      }
    }

    fetchSquad();
  }, [isOpen, squadId]);

  // Quick status update (Yes/Maybe/No)
  const handleQuickStatusUpdate = async (status: 'THINKING' | 'IN' | 'OUT') => {
    if (!squad || updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/squads/${squad.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const squadResponse = await fetch(`/api/squads/${squad.id}`);
        if (squadResponse.ok) {
          const data = await squadResponse.json();
          setSquad(data.squad);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentMember = squad?.members.find(m => m.userId === currentUserId);
  const statusCounts = squad ? {
    in: squad.members.filter(m => m.status === 'IN').length,
    thinking: squad.members.filter(m => m.status === 'THINKING').length,
    out: squad.members.filter(m => m.status === 'OUT').length,
  } : { in: 0, thinking: 0, out: 0 };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>👥</span>
            Squad
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center">
            <div className="animate-pulse text-gray-500">Loading...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {squad && (
          <div className="space-y-4">
            {/* Event Info - Compact */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                {squad.event.displayTitle}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
              </p>
            </div>

            {/* Members Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {squad.members.length} {squad.members.length === 1 ? 'member' : 'members'}
                </span>
                <div className="flex gap-2 text-xs">
                  {statusCounts.in > 0 && (
                    <span className="text-green-600">{statusCounts.in} in</span>
                  )}
                  {statusCounts.thinking > 0 && (
                    <span className="text-amber-500">{statusCounts.thinking} maybe</span>
                  )}
                </div>
              </div>
              
              {/* Avatar row */}
              <div className="flex -space-x-2">
                {squad.members.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                    style={getAvatarStyle(member.userId)}
                    title={getDisplayName(member.user.displayName, member.user.email)}
                  >
                    {getInitials(member.user.displayName, member.user.email)}
                  </div>
                ))}
                {squad.members.length > 6 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{squad.members.length - 6}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Toggle */}
            {currentMember && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">Your status:</div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'IN', label: '✓ Yes', color: 'green' },
                    { value: 'THINKING', label: '? Maybe', color: 'amber' },
                    { value: 'OUT', label: '✗ No', color: 'red' },
                  ].map((option) => {
                    const isSelected = currentMember.status === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleQuickStatusUpdate(option.value as 'THINKING' | 'IN' | 'OUT')}
                        disabled={updatingStatus}
                        className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          isSelected
                            ? option.color === 'green' 
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : option.color === 'amber'
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View Full Squad - Primary CTA */}
            <Link
              href={`/squads/${squad.id}`}
              onClick={onClose}
              className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Squad Details →
            </Link>

            {/* Solo hint */}
            {squad.members.length === 1 && (
              <p className="text-xs text-gray-500 text-center">
                Open the full squad to invite friends
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
