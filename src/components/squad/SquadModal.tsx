'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SquadStatusControls } from './SquadStatusControls';
import { SquadSnapshot } from './SquadSnapshot';
import { SquadLogistics } from './SquadLogistics';
import { generateSharePlanText, generateDayOfText } from '@/lib/squadShareText';
import { SquadInviteModal } from './SquadInviteModal';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  budget: string | null;
  ticketStatus: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
  buyingForCount: number | null;
  buyingForIds: string[];
  isOrganizer: boolean;
  user: {
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
    displayTitle: string; // Canonical title (TM preferred or fallback)
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

export function SquadModal({ squadId, eventId, isOpen, onClose }: SquadModalProps) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null); // 'plan' | 'dayof' | null
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch squad data when modal opens
  useEffect(() => {
    if (!isOpen || !squadId) return;

    async function fetchSquad() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/squads/${squadId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch squad');
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
  }, [squadId, isOpen]);

  // Create new squad if we have eventId but no squadId
  useEffect(() => {
    if (!isOpen || squadId || !eventId) return;

    async function createSquad() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/squads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // If user already has a squad, try to fetch it instead
          if (response.status === 409 && errorData.error?.includes('already have a squad')) {
            // Try to find their existing squad for this event
            const existingSquadResponse = await fetch(`/api/events/${eventId}/squad`);
            if (existingSquadResponse.ok) {
              const existingData = await existingSquadResponse.json();
              if (existingData.hasSquad && existingData.squadId) {
                // Fetch the existing squad
                const squadResponse = await fetch(`/api/squads/${existingData.squadId}`);
                if (squadResponse.ok) {
                  const squadData = await squadResponse.json();
                  setSquad(squadData.squad);
                  setCurrentUserId(squadData.currentUserId);
                  return;
                }
              }
            }
          }
          
          throw new Error(errorData.error || 'Failed to create squad');
        }

        const data = await response.json();
        setSquad(data.squad);
        setCurrentUserId(data.squad.createdById); // Creator is the current user
      } catch (err) {
        console.error('Error creating squad:', err);
        setError(err instanceof Error ? err.message : 'Failed to create squad');
      } finally {
        setLoading(false);
      }
    }

    createSquad();
  }, [squadId, eventId, isOpen]);

  const handleStatusUpdate = async (updates: {
    status?: 'THINKING' | 'IN' | 'OUT';
    budget?: string | null;
    ticketStatus?: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
    buyingForCount?: number | null;
    buyingForIds?: string[];
  }) => {
    if (!squad) return;

    try {
      const response = await fetch(`/api/squads/${squad.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Refresh squad data
      const squadResponse = await fetch(`/api/squads/${squad.id}`);
      if (squadResponse.ok) {
        const data = await squadResponse.json();
        setSquad(data.squad);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleLogisticsUpdate = async (updates: {
    meetTime?: string | null;
    meetSpot?: string | null;
    deadline?: string | null;
    playlistUrl?: string | null;
  }) => {
    if (!squad) return;

    try {
      const response = await fetch(`/api/squads/${squad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update logistics');
      }

      // Refresh squad data
      const squadResponse = await fetch(`/api/squads/${squad.id}`);
      if (squadResponse.ok) {
        const data = await squadResponse.json();
        setSquad(data.squad);
      }
    } catch (err) {
      console.error('Error updating logistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to update logistics');
    }
  };

  const handleLeaveSquad = async () => {
    if (!squad) return;

    const confirmed = window.confirm('Are you sure you want to leave this squad?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave squad');
      }

      const data = await response.json();
      
      if (data.squadDeleted) {
        // Squad was deleted (user was last member)
        onClose();
        // Could show a toast: "Squad deleted since you were the last member"
      } else {
        // Squad still exists, user left successfully
        onClose();
        // Could show a toast: "You left the squad"
      }
    } catch (err) {
      console.error('Error leaving squad:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave squad');
    }
  };

  const handleSharePlan = async () => {
    if (!squad || !currentUserId) return;

    setCopying('plan');
    try {
      const shareText = generateSharePlanText(squad, currentUserId);
      await navigator.clipboard.writeText(shareText);
      
      // Could show a toast: "Copied to clipboard!"
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error copying share text:', err);
      setError('Failed to copy to clipboard');
      setCopying(null);
    }
  };

  const handleShareDayOf = async () => {
    if (!squad) return;

    setCopying('dayof');
    try {
      const shareText = generateDayOfText(squad);
      await navigator.clipboard.writeText(shareText);
      
      // Could show a toast: "Copied to clipboard!"
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error copying day-of text:', err);
      setError('Failed to copy to clipboard');
      setCopying(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>👥</span>
            Squad Planning
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="p-6 py-8 text-center">
            <div className="animate-pulse">Loading squad...</div>
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          </div>
        )}

        {squad && (
          <div className="p-6 space-y-6">
            {/* Event Info */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-1">
                {squad.event.displayTitle || squad.event.title}
              </h3>
              <p className="text-sm text-gray-600">
                {formatInTimeZone(new Date(squad.event.startDateTime), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
                {' • '}
                {squad.event.venue.name}
              </p>
            </div>

            {/* Your Status Controls */}
            <SquadStatusControls
              squad={squad}
              currentUserId={currentUserId || undefined}
              onStatusUpdate={handleStatusUpdate}
            />

            {/* Squad Snapshot */}
            <SquadSnapshot 
              squad={squad} 
              onInviteFriends={() => setShowInviteModal(true)}
              isOrganizer={squad.members.find(m => m.userId === currentUserId)?.isOrganizer || false}
            />

            {/* Logistics */}
            <SquadLogistics
              squad={squad}
              onLogisticsUpdate={handleLogisticsUpdate}
            />

            {/* Share Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button 
                onClick={handleSharePlan}
                disabled={copying === 'plan'}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  squad.members.length === 1 
                    ? 'bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-300 ring-offset-2' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copying === 'plan' ? '📋 Copied!' : squad.members.length === 1 ? '📤 Share Plan' : 'Share Plan'}
              </button>
              <button 
                onClick={handleShareDayOf}
                disabled={copying === 'dayof' || (!squad.meetTime && !squad.meetSpot)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={(!squad.meetTime && !squad.meetSpot) ? 'Set meetup details first' : ''}
              >
                {copying === 'dayof' ? '📋 Copied!' : 'Share Day-of'}
              </button>
            </div>

            {/* Leave Squad - Danger Zone */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleLeaveSquad}
                className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Leave Squad
              </button>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Squad Invite Modal */}
      {showInviteModal && squad && (
        <SquadInviteModal
          squad={squad}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onMemberAdded={async () => {
            setShowInviteModal(false);
            // Refresh squad data
            if (squadId) {
              try {
                const response = await fetch(`/api/squads/${squadId}`);
                if (response.ok) {
                  const updatedSquad = await response.json();
                  setSquad(updatedSquad);
                }
              } catch (error) {
                console.error('Failed to refresh squad:', error);
              }
            }
          }}
        />
      )}
    </Dialog>
  );
}
