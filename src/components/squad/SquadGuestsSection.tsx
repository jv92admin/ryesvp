'use client';

import { useState } from 'react';
import { Button, ToggleChip } from '@/components/ui';

interface SquadGuestsSectionProps {
  squadId: string;
  currentGuestCount: number;
  onUpdate: () => void;
}

export function SquadGuestsSection({ squadId, currentGuestCount, onUpdate }: SquadGuestsSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customCount, setCustomCount] = useState(currentGuestCount > 2 ? currentGuestCount.toString() : '');

  async function updateGuestCount(count: number) {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestCount: count }),
      });
      if (res.ok) {
        setShowCustom(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update guest count:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  const handleCustomSubmit = () => {
    const count = parseInt(customCount);
    if (!isNaN(count) && count >= 0) {
      updateGuestCount(count);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 flex-shrink-0">Guests?</span>
      <div className="flex gap-1 flex-1">
        <ToggleChip
          active={currentGuestCount === 1}
          onClick={() => updateGuestCount(currentGuestCount === 1 ? 0 : 1)}
          disabled={isUpdating}
          color="primary"
        >
          +1
        </ToggleChip>
        <ToggleChip
          active={currentGuestCount === 2}
          onClick={() => updateGuestCount(currentGuestCount === 2 ? 0 : 2)}
          disabled={isUpdating}
          color="primary"
        >
          +2
        </ToggleChip>
        
        {showCustom ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="99"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              className="w-12 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 text-gray-900"
              placeholder="3+"
            />
            <Button
              variant="primary"
              size="xs"
              onClick={handleCustomSubmit}
              disabled={isUpdating}
            >
              ✓
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowCustom(false)}
            >
              ✗
            </Button>
          </div>
        ) : (
          <ToggleChip
            active={currentGuestCount > 2}
            onClick={() => setShowCustom(true)}
            color="primary"
          >
            {currentGuestCount > 2 ? `+${currentGuestCount}` : '3+'}
          </ToggleChip>
        )}
      </div>
    </div>
  );
}

