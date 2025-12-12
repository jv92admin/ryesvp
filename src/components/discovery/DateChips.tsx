'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToggleChip } from '@/components/ui';

type DatePreset = 'thisWeek' | 'weekend';

/**
 * Date range chips for quick filtering.
 * 
 * Uses ?when= param for presets, ?startDate= + ?endDate= for custom range.
 * Includes a "Pick dates" dropdown for custom date range selection.
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
    
    if (start) {
      params.set('startDate', start);
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
          color="primary"
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
          color="primary"
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
          <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => {
                    setLocalStart(e.target.value);
                    handleDateChange(e.target.value, localEnd);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md 
                           focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => {
                    setLocalEnd(e.target.value);
                    handleDateChange(localStart, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md
                           focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                />
              </div>
              {hasCustomDates && (
                <button
                  type="button"
                  onClick={clearDates}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
