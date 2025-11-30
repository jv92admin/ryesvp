'use client';

import { useState } from 'react';
import { getDisplayName } from '@/lib/avatar';

// Ticket status type (matches Prisma enum)
type TicketStatus = 'YES' | 'MAYBE' | 'NO' | 'COVERED';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: TicketStatus;
  coveredById: string | null;
  buyingForIds: string[];
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface SquadTicketsSectionProps {
  squadId: string;
  members: SquadMember[];
  currentUserId: string;
  onUpdate: () => void;
}

export function SquadTicketsSection({ squadId, members, currentUserId, onUpdate }: SquadTicketsSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const currentMember = members.find(m => m.userId === currentUserId);
  if (!currentMember) return null;

  const isOut = currentMember.status === 'OUT';

  // Members I'm currently covering (from my buyingForIds)
  const membersCovering = members.filter(m => 
    currentMember.buyingForIds?.includes(m.userId)
  );
  
  // IDs I'm already covering
  const alreadyCoveringIds = currentMember.buyingForIds || [];

  // Members who need tickets:
  // - Not OUT
  // - Status is MAYBE or NO (not YES, not COVERED)
  // - Not me
  // - Not already COVERED by anyone
  // - Not already in my buyingForIds (belt-and-suspenders)
  const membersNeedingTickets = members.filter(m => 
    m.status !== 'OUT' && 
    m.ticketStatus !== 'YES' &&
    m.ticketStatus !== 'COVERED' &&
    m.userId !== currentUserId &&
    !alreadyCoveringIds.includes(m.userId) &&
    !m.coveredById // Not covered by anyone
  );

  // Is current user's ticket covered by someone else?
  const isCovered = currentMember.ticketStatus === 'COVERED';
  const coveredByMember = isCovered 
    ? members.find(m => m.userId === currentMember.coveredById)
    : null;

  // Has ticket = YES
  const hasTicket = currentMember.ticketStatus === 'YES';

  async function updateMyTicketStatus(status: TicketStatus) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketStatus: status }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCoverSelected() {
    if (selectedMembers.length === 0) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/buy-for`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMembers }),
      });
      if (res.ok) {
        setSelectedMembers([]);
        setShowPicker(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to cover members:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  function toggleMemberSelection(userId: string) {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleUncover(userId: string) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/buy-for`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: userId }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to uncover member:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  // If out, don't show ticket section
  if (isOut) {
    return null;
  }

  // If covered by someone else
  if (isCovered && coveredByMember) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <span className="text-purple-600">✓</span>
        <span className="text-purple-900 ml-2 text-sm">
          <strong>{getDisplayName(coveredByMember.user.displayName, coveredByMember.user.email)}</strong> is getting your ticket
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* My ticket status - Have/Getting vs Need */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 flex-shrink-0">Ticket?</span>
        <div className="flex gap-1 flex-1">
          <button
            onClick={() => updateMyTicketStatus('YES')}
            disabled={isUpdating}
            className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              hasTicket
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            Have / Getting
          </button>
          <button
            onClick={() => updateMyTicketStatus('MAYBE')}
            disabled={isUpdating}
            className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentMember.ticketStatus === 'MAYBE'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            Need
          </button>
        </div>
      </div>

      {/* Cover others - show if I have a ticket and there are people to cover or already covering */}
      {hasTicket && (membersNeedingTickets.length > 0 || membersCovering.length > 0) && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 flex-shrink-0">Cover others?</span>
          <div className="flex gap-1 flex-1 flex-wrap items-center">
            {/* People I'm covering - inline pills with × */}
            {membersCovering.map(m => (
              <span 
                key={m.userId}
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-purple-100 rounded-full text-xs text-purple-700"
              >
                {getDisplayName(m.user.displayName, m.user.email)}
                <button
                  onClick={() => handleUncover(m.userId)}
                  disabled={isUpdating}
                  className="text-purple-400 hover:text-red-500 disabled:opacity-50 ml-0.5"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
            
            {/* Add button - only if there are people who need tickets */}
            {membersNeedingTickets.length > 0 && (
              <button
                onClick={() => setShowPicker(!showPicker)}
                className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                  showPicker 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      )}

      {/* Member picker - shows when + Add is clicked */}
      {hasTicket && showPicker && membersNeedingTickets.length > 0 && (
        <div className="p-2 bg-gray-50 rounded-lg space-y-1">
          {membersNeedingTickets.map(member => (
            <label
              key={member.userId}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedMembers.includes(member.userId)}
                onChange={() => toggleMemberSelection(member.userId)}
                className="w-3.5 h-3.5 text-purple-600 rounded border-gray-300"
              />
              <span className="text-gray-900">
                {getDisplayName(member.user.displayName, member.user.email)}
              </span>
            </label>
          ))}
          {selectedMembers.length > 0 && (
            <button
              onClick={handleCoverSelected}
              disabled={isUpdating}
              className="w-full mt-2 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              Cover {selectedMembers.length} selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}
