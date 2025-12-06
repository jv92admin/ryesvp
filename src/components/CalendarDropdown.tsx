'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  CalendarType, 
  exportToCalendar, 
  getCalendarDisplayName,
  getCalendarIcon 
} from '@/lib/calendar';
import { useToast } from '@/contexts/ToastContext';

interface Squad {
  id: string;
  event: {
    displayTitle: string;
    startDateTime: string;
    venue: {
      name: string;
      city: string | null;
      state: string | null;
    };
  };
  members: Array<{
    user: {
      displayName: string | null;
    };
  }>;
}

interface CalendarDropdownProps {
  squad: Squad;
  currentPreference?: string | null;
  className?: string;
}

const CALENDAR_OPTIONS: CalendarType[] = ['GOOGLE', 'APPLE', 'OUTLOOK'];

export function CalendarDropdown({ 
  squad, 
  currentPreference,
  className = '' 
}: CalendarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preference, setPreference] = useState<CalendarType | null>(
    currentPreference as CalendarType | null
  );
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: CalendarType) => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      const baseUrl = window.location.origin;
      exportToCalendar(squad, type, baseUrl);

      // Save preference if different
      if (type !== preference) {
        await fetch('/api/users/me/calendar-preference', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preference: type }),
        });
        setPreference(type);
      }

      // Show appropriate toast
      if (type === 'GOOGLE') {
        showToast({
          message: 'Opening Google Calendar...',
          type: 'success',
        });
      } else {
        showToast({
          message: 'Calendar event downloaded!',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      showToast({
        message: 'Failed to export to calendar',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleButtonClick = () => {
    if (preference) {
      // Direct action with saved preference
      handleExport(preference);
    } else {
      // Show dropdown for first-time users
      setIsOpen(!isOpen);
    }
  };

  // Cleaner label: "Add to Calendar" for first time, "Google Calendar" after
  const buttonLabel = preference 
    ? getCalendarDisplayName(preference)
    : 'Add to Calendar';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main Button - minimal text link style */}
      <div className="flex items-center">
        <button
          onClick={handleButtonClick}
          disabled={isExporting}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
        >
          {/* Calendar Icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{buttonLabel}</span>
        </button>
        {/* Dropdown arrow - separate button for easier tapping */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-1 p-1.5 -mr-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
        >
          <svg 
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]">
          {CALENDAR_OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                type === preference ? 'bg-green-50 text-green-700' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{getCalendarDisplayName(type)}</span>
              {type === preference && (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

