'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanModeView } from './PlanModeView';
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
    };
  };
  members: SquadMember[];
}

interface SquadPageProps {
  squad: Squad;
  currentUserId: string;
  enrichment?: unknown;
}

export function SquadPage({ squad: initialSquad, currentUserId, enrichment }: SquadPageProps) {
  const [squad, setSquad] = useState<Squad>(initialSquad);
  const [mode, setMode] = useState<'plan' | 'dayof'>('plan');
  const [copying, setCopying] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const router = useRouter();

  // Refresh squad data from API
  const refreshSquad = async () => {
    try {
      const response = await fetch(`/api/squads/${squad.id}`);
      if (response.ok) {
        const data = await response.json();
        setSquad(data.squad);
      }
    } catch (error) {
      console.error('Failed to refresh squad:', error);
    }
  };

  const handleStatusUpdate = async (updates: { status?: 'THINKING' | 'IN' | 'OUT' }) => {
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

      router.push(`/events/${squad.eventId}`);
    } catch (err) {
      console.error('Error leaving squad:', err);
    }
  };

  const handleSharePlan = async () => {
    setCopying('plan');
    try {
      const shareText = generateSharePlanText(squad, currentUserId);
      await navigator.clipboard.writeText(shareText);
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error copying share text:', err);
      setCopying(null);
    }
  };

  const handleShareDayOf = async () => {
    setCopying('dayof');
    try {
      const shareText = generateDayOfText(squad);
      await navigator.clipboard.writeText(shareText);
      setTimeout(() => setCopying(null), 1000);
    } catch (err) {
      console.error('Error copying day-of text:', err);
      setCopying(null);
    }
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const isOrganizer = squad.members.find(m => m.userId === currentUserId)?.isOrganizer || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🌤️</div>
            <h3 className="font-medium text-gray-900 mb-2">Day-of Mode</h3>
            <p className="text-gray-500 text-sm">
              Weather, logistics, and "know before you go" info will appear here closer to the event.
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
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
    </div>
  );
}
