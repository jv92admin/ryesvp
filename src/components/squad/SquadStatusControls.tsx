'use client';

import { useState } from 'react';

interface Squad {
  id: string;
  members: Array<{
    id: string;
    userId: string;
    status: 'THINKING' | 'IN' | 'OUT';
    budget: string | null;
    ticketStatus: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
    buyingForCount: number | null;
    buyingForIds: string[];
    user: {
      displayName: string | null;
      email: string;
    };
  }>;
}

interface SquadStatusControlsProps {
  squad: Squad;
  currentUserId?: string;
  onStatusUpdate: (updates: {
    status?: 'THINKING' | 'IN' | 'OUT';
    budget?: string | null;
    ticketStatus?: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
    buyingForCount?: number | null;
    buyingForIds?: string[];
  }) => void;
}

export function SquadStatusControls({ squad, currentUserId, onStatusUpdate }: SquadStatusControlsProps) {
  // Find current user's member record
  const currentMember = currentUserId 
    ? squad.members.find(m => m.userId === currentUserId)
    : squad.members[0]; // Fallback to first member if no currentUserId
  
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [updatingTickets, setUpdatingTickets] = useState(false);
  const [selectedBuyingFor, setSelectedBuyingFor] = useState<string[]>(
    currentMember?.buyingForIds || []
  );

  const handleStatusChange = async (status: 'THINKING' | 'IN' | 'OUT') => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      await onStatusUpdate({ status });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBudgetChange = async (budget: string | null) => {
    if (updatingBudget) return;
    
    setUpdatingBudget(true);
    try {
      await onStatusUpdate({ budget });
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleTicketStatusChange = async (ticketStatus: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS') => {
    if (updatingTickets) return;
    
    setUpdatingTickets(true);
    try {
      const updates: any = { ticketStatus };
      
      // Clear buying for data if not buying for others
      if (ticketStatus !== 'BUYING_FOR_OTHERS') {
        updates.buyingForCount = null;
        updates.buyingForIds = [];
        setSelectedBuyingFor([]);
      } else {
        // When selecting "buying for others", include current selection
        updates.buyingForIds = selectedBuyingFor;
        updates.buyingForCount = selectedBuyingFor.length;
      }
      
      await onStatusUpdate(updates);
    } finally {
      setUpdatingTickets(false);
    }
  };

  const handleBuyingForToggle = async (userId: string) => {
    const newSelection = selectedBuyingFor.includes(userId)
      ? selectedBuyingFor.filter(id => id !== userId)
      : [...selectedBuyingFor, userId];
    
    setSelectedBuyingFor(newSelection);
    
    // Update immediately if already in "buying for others" mode
    if (currentMember?.ticketStatus === 'BUYING_FOR_OTHERS') {
      setUpdatingTickets(true);
      try {
        await onStatusUpdate({
          buyingForIds: newSelection,
          buyingForCount: newSelection.length,
        });
      } finally {
        setUpdatingTickets(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Your Status</h4>
      
      {/* Squad Member Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Attendance</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'THINKING', label: '🤔 Thinking', color: 'amber' },
            { value: 'IN', label: '✅ In', color: 'green' },
            { value: 'OUT', label: '❌ Out', color: 'red' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value as 'THINKING' | 'IN' | 'OUT')}
              disabled={updatingStatus}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentMember?.status === option.value
                  ? option.color === 'amber'
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                    : option.color === 'green'
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: null, label: 'No preference' },
            { value: 'UNDER_50', label: 'Under $50' },
            { value: 'FIFTY_TO_100', label: '$50-100' },
            { value: 'OVER_100', label: '$100+' },
          ].map((option) => (
            <button
              key={option.value || 'none'}
              onClick={() => handleBudgetChange(option.value)}
              disabled={updatingBudget}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentMember?.budget === option.value
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tickets</label>
        <div className="space-y-2">
          {[
            { value: 'NOT_BOUGHT', label: '⏳ Not bought yet' },
            { value: 'BUYING_OWN', label: '🎫 Buying my own' },
            { value: 'BUYING_FOR_OTHERS', label: '🎫 Buying for others' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleTicketStatusChange(option.value as 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS')}
              disabled={updatingTickets}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                currentMember?.ticketStatus === option.value
                  ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                  : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member Selection for Buying Tickets */}
      {currentMember?.ticketStatus === 'BUYING_FOR_OTHERS' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buying tickets for:
          </label>
          <div className="space-y-2">
            {squad.members
              .filter(member => member.userId !== currentUserId) // Don't show current user
              .map((member) => (
                <label 
                  key={member.userId} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedBuyingFor?.includes(member.userId) || false}
                    onChange={() => handleBuyingForToggle(member.userId)}
                    disabled={updatingTickets}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {member.user.displayName || member.user.email}
                    </div>
                    <div className="text-xs text-gray-600">
                      Status: {member.status === 'IN' ? '✅ In' : member.status === 'THINKING' ? '🤔 Thinking' : '❌ Out'}
                    </div>
                  </div>
                </label>
              ))}
          </div>
          
          {selectedBuyingFor.length > 0 && (
            <div className="mt-2 p-2 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-700">
                Buying tickets for {selectedBuyingFor.length} member{selectedBuyingFor.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
