'use client';

import { useState } from 'react';

interface DiscoveryChip {
  id: string;
  label: string;
  count?: number;
  isActive: boolean;
  isComingSoon?: boolean;
}

interface DiscoveryStripProps {
  newListingsCount?: number;
  onChipClick?: (chipId: string) => void;
  activeChip?: string | null;
}

export function DiscoveryStrip({ 
  newListingsCount = 0, 
  onChipClick,
  activeChip = null 
}: DiscoveryStripProps) {
  const chips: DiscoveryChip[] = [
    {
      id: 'new',
      label: 'New',
      count: newListingsCount,
      isActive: newListingsCount > 0,
      isComingSoon: newListingsCount === 0,
    },
    {
      id: 'presales',
      label: 'Presales',
      isActive: false,
      isComingSoon: true,
    },
    {
      id: 'foryou',
      label: 'For you',
      isActive: false,
      isComingSoon: true,
    },
  ];

  // Only show chips that are active or we want to hint at
  const visibleChips = chips.filter(chip => chip.isActive || chip.isComingSoon);

  // If no chips to show, return null
  if (visibleChips.length === 0) {
    return null;
  }

  const handleClick = (chip: DiscoveryChip) => {
    if (chip.isActive && onChipClick) {
      onChipClick(chip.id);
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none">
      {visibleChips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => handleClick(chip)}
          disabled={!chip.isActive}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            whitespace-nowrap transition-colors
            ${activeChip === chip.id
              ? 'bg-[var(--brand-primary)] text-white'
              : chip.isActive
                ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:bg-green-200 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
          title={chip.isComingSoon && !chip.isActive ? 'Coming soon' : undefined}
        >
          <span>{chip.label}</span>
          {chip.count !== undefined && chip.count > 0 && (
            <span className={`
              px-1.5 py-0.5 text-xs rounded-full
              ${activeChip === chip.id
                ? 'bg-green-500 text-white'
                : 'bg-green-200 text-green-800'
              }
            `}>
              {chip.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

