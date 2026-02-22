'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToggleChip } from '@/components/ui';

type DatePreset = 'thisWeek' | 'weekend';

/**
 * @deprecated Replaced by FilterDrawer (When section) + FilterStrip quick chips.
 * Logic inlined into FilterDrawer.tsx and FilterStrip.tsx as of Inc 2.
 * Safe to delete once verified no other imports exist.
 */
export function DateChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWhen = searchParams.get('when') as DatePreset | null;
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local state with URL
  useEffect(() => {
    setLocalStart(startDate);
    setLocalEnd(endDate);
  }, [startDate, endDate]);

  const handleChipClick = (preset: DatePreset) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (currentWhen === preset) {
      // Toggle off - remove the filter
      params.delete('when');
    } else {
      // Set new preset - clear explicit dates
      params.set('when', preset);
      params.delete('startDate');
      params.delete('endDate');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  const handleDateChange = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear preset when using explicit dates
    params.delete('when');
    
    // If only end date is set, default start to today
    const effectiveStart = start || (end ? today : '');
    
    if (effectiveStart) {
      params.set('startDate', effectiveStart);
    } else {
      params.delete('startDate');
    }
    
    if (end) {
      params.set('endDate', end);
    } else {
      params.delete('endDate');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  const clearDates = () => {
    setLocalStart('');
    setLocalEnd('');
    handleDateChange('', '');
    setShowDatePicker(false);
  };

  const hasCustomDates = !!(startDate || endDate);
  const isCustomActive = hasCustomDates && !currentWhen;

  // Format date for display
  const formatDateLabel = () => {
    if (!startDate && !endDate) return 'Dates';
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} – ${end}`;
    }
    if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  const chips: { id: DatePreset; label: string }[] = [
    { id: 'thisWeek', label: 'This Week' },
    { id: 'weekend', label: 'This Weekend' },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {chips.map((chip) => (
        <ToggleChip
          key={chip.id}
          active={currentWhen === chip.id}
          onClick={() => handleChipClick(chip.id)}
          size="sm"
        >
          {chip.label}
        </ToggleChip>
      ))}

      {/* Date Picker Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <ToggleChip
          active={isCustomActive}
          onClick={() => setShowDatePicker(!showDatePicker)}
          size="sm"
        >
          <span className="flex items-center gap-1">
            {formatDateLabel()}
            <svg 
              className={`w-3 h-3 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </ToggleChip>
        
        {showDatePicker && (
          <div className="fixed sm:absolute top-32 sm:top-full left-4 right-4 sm:left-0 sm:right-auto mt-2 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg z-50 sm:min-w-[280px]">
            <div className="space-y-3">
              {/* Combined date range display */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--lark-text-secondary)] mb-1">From</label>
                  <input
                    type="date"
                    value={localStart}
                    min={today}
                    onChange={(e) => {
                      setLocalStart(e.target.value);
                      handleDateChange(e.target.value, localEnd);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded-md
                             text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:border-transparent"
                  />
                </div>
                <span className="text-[var(--lark-text-muted)] mt-5">→</span>
                <div className="flex-1">
                  <label className="block text-xs text-[var(--lark-text-secondary)] mb-1">To</label>
                  <input
                    type="date"
                    value={localEnd}
                    min={localStart || today}
                    onChange={(e) => {
                      setLocalEnd(e.target.value);
                      handleDateChange(localStart, e.target.value);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded-md
                             text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                {hasCustomDates ? (
                  <button
                    type="button"
                    onClick={clearDates}
                    className="text-xs text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]"
                  >
                    Clear
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-1 text-xs font-medium text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
