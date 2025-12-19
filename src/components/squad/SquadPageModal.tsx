'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PlanModeView } from './PlanModeView';
import { DayOfModeView } from './DayOfModeView';
import { SquadInviteModal } from './SquadInviteModal';
import { generateSharePlanText, generateDayOfText } from '@/lib/squadShareText';

// Ticket status type (matches Prisma enum)
type TicketStatus = 'YES' | 'MAYBE' | 'NO' | 'COVERED';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: TicketStatus;
  coveredById: string | null;
  buyingForIds: string[];
  guestCount: number;
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
      city: string | null;
      state: string | null;
      lat: number | null;
      lng: number | null;
    };
  };
  members: SquadMember[];
}

interface SquadPageModalProps {
  squadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SquadPageModal({ squadId, isOpen, onClose }: SquadPageModalProps) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'plan' | 'dayof'>('plan');
  const [copying, setCopying] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch squad data when modal opens
  useEffect(() => {
    if (!isOpen || !squadId) return;

    // Mark any ADDED_TO_PLAN notification for this squad as read
    async function markNotificationRead() {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          const notification = data.notifications?.find(
            (n: { type: string; payload: { squadId?: string }; readAt: string | null }) =>
              n.type === 'ADDED_TO_PLAN' && n.payload?.squadId === squadId && !n.readAt
          );
          if (notification) {
            await fetch(`/api/notifications/${notification.id}`, { method: 'PATCH' });
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    markNotificationRead();

    async function fetchSquad() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/squads/${squadId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load plan');
        }

        const data = await response.json();
        setSquad(data.squad);
        setCurrentUserId(data.currentUserId);
      } catch (err) {
        console.error('Error fetching squad:', err);
        setError(err instanceof Error ? err.message : 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    }

    fetchSquad();
  }, [isOpen, squadId]);

  // Refresh squad data from API
  const refreshSquad = async () => {
    try {
      const response = await fetch(`/api/squads/${squadId}`);
      if (response.ok) {
        const data = await response.json();
        setSquad(data.squad);
      }
    } catch (error) {
      console.error('Failed to refresh squad:', error);
    }
  };

  const handleStatusUpdate = async (updates: { status?: 'THINKING' | 'IN' | 'OUT' }) => {
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

      await refreshSquad();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleLeaveSquad = async () => {
    if (!squad) return;
    
    const confirmed = window.confirm('Are you sure you want to leave this plan?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave plan');
      }

      onClose();
      // Refresh the page to update UI
      window.location.reload();
    } catch (err) {
      console.error('Error leaving squad:', err);
    }
  };

  const handleSharePlan = async () => {
    if (!squad || !currentUserId) return;
    
    setCopying('plan');
    try {
      const shareText = generateSharePlanText(squad, currentUserId);
      const shareUrl = `${window.location.origin}/squads/${squad.id}`;
      
      // Try native share first (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: squad.event.displayTitle,
            text: shareText,
            url: shareUrl,
          });
          setCopying(null);
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            setCopying(null);
            return;
          }
        }
      }
      
      await navigator.clipboard.writeText(shareText);
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error sharing plan:', err);
      setCopying(null);
    }
  };

  const handleShareDayOf = async () => {
    if (!squad) return;
    
    setCopying('dayof');
    try {
      const shareText = generateDayOfText(squad);
      
      // Try native share first (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Day-of: ${squad.event.displayTitle}`,
            text: shareText,
          });
          setCopying(null);
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            setCopying(null);
            return;
          }
        }
      }
      
      await navigator.clipboard.writeText(shareText);
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error sharing day-of:', err);
      setCopying(null);
    }
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const isOrganizer = squad?.members.find(m => m.userId === currentUserId)?.isOrganizer || false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {loading && (
          <div className="py-12 text-center">
            <div className="animate-pulse text-gray-500">Loading...</div>
          </div>
        )}

        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {squad && currentUserId && (
          <div className="p-4">
            {/* Mode Toggle - Apple-style full-width */}
            <div className="mb-4 bg-gray-100 rounded-full p-0.5">
              <div className="relative flex">
                <button
                  onClick={() => setMode('plan')}
                  className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all relative z-10 ${
                    mode === 'plan'
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  Plan
                </button>
                <button
                  onClick={() => setMode('dayof')}
                  className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-full transition-all relative z-10 ${
                    mode === 'dayof'
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  Day-of
                </button>
                {/* Sliding background */}
                <div
                  className={`absolute top-0.5 bottom-0.5 w-1/2 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    mode === 'dayof' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                  style={{ left: '2px', right: '2px', width: 'calc(50% - 2px)' }}
                />
              </div>
            </div>

            {/* Content based on mode */}
            {mode === 'plan' ? (
              <PlanModeView
                squad={squad}
                currentUserId={currentUserId}
                isOrganizer={isOrganizer}
                onStatusUpdate={handleStatusUpdate}
                onSquadRefresh={refreshSquad}
                onSharePlan={handleSharePlan}
                onShareDayOf={handleShareDayOf}
                onInvite={handleInvite}
                onLeaveSquad={handleLeaveSquad}
                copying={copying}
              />
            ) : (
              <DayOfModeView
                squad={squad}
                currentUserId={currentUserId}
                onSquadRefresh={refreshSquad}
                enrichment={null}  // Modal doesn't fetch enrichment, KBYG shows on full page
              />
            )}
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && squad && (
          <SquadInviteModal
            squad={squad}
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onMemberAdded={async () => {
              setShowInviteModal(false);
              await refreshSquad();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

