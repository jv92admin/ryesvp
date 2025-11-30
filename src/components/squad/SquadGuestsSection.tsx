'use client';

import { useState } from 'react';

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
        <button
          onClick={() => updateGuestCount(currentGuestCount === 1 ? 0 : 1)}
          disabled={isUpdating}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            currentGuestCount === 1
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          +1
        </button>
        <button
          onClick={() => updateGuestCount(currentGuestCount === 2 ? 0 : 2)}
          disabled={isUpdating}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            currentGuestCount === 2
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          +2
        </button>
        
        {showCustom ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="99"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              className="w-12 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500"
              placeholder="3+"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={isUpdating}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              ✓
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              ✗
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentGuestCount > 2
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {currentGuestCount > 2 ? `+${currentGuestCount}` : '3+'}
          </button>
        )}
      </div>
    </div>
  );
}

