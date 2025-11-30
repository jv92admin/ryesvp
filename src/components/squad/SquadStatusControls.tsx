'use client';

import { useState } from 'react';

interface Squad {
  id: string;
  members: Array<{
    id: string;
    userId: string;
    status: 'THINKING' | 'IN' | 'OUT';
    user: {
      displayName: string | null;
      email: string;
    };
  }>;
}

interface SquadStatusControlsProps {
  squad: Squad;
  currentUserId?: string;
  onStatusUpdate: (updates: { status?: 'THINKING' | 'IN' | 'OUT' }) => void;
}

const STATUS_OPTIONS = [
  { value: 'IN', label: 'Yes', color: 'green' },
  { value: 'THINKING', label: 'Maybe', color: 'amber' },
  { value: 'OUT', label: 'No', color: 'red' },
] as const;

export function SquadStatusControls({ squad, currentUserId, onStatusUpdate }: SquadStatusControlsProps) {
  const currentMember = currentUserId 
    ? squad.members.find(m => m.userId === currentUserId)
    : squad.members[0];
  
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (status: 'THINKING' | 'IN' | 'OUT') => {
    if (updatingStatus || currentMember?.status === status) return;
    
    setUpdatingStatus(true);
    try {
      await onStatusUpdate({ status });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 flex-shrink-0">Going?</span>
      <div className="flex gap-1 flex-1">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = currentMember?.status === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={updatingStatus}
              className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? option.color === 'green' 
                    ? 'bg-green-100 text-green-700' 
                    : option.color === 'amber'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
