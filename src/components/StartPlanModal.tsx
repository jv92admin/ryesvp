'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatEventDate } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { Chip } from '@/components/ui';

interface Event {
  id: string;
  title: string;
  displayTitle: string;
  startDateTime: string;
  venue: { name: string };
  imageUrl?: string | null;
}

interface StartPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedFriendId?: string;
}

type DatePreset = 'thisWeek' | 'weekend' | null;

export function StartPlanModal({ isOpen, onClose, preSelectedFriendId }: StartPlanModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Event list state
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close date picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch events with search + date filters
  const fetchEvents = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      
      // Add search query
      if (debouncedQuery.trim()) {
        params.set('q', debouncedQuery.trim());
      }
      
      // Add date filters
      if (datePreset) {
        params.set('when', datePreset);
      } else if (customStartDate || customEndDate) {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }
      
      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, debouncedQuery, datePreset, customStartDate, customEndDate]);

  // Fetch when modal opens or filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setDatePreset(null);
      setCustomStartDate('');
      setCustomEndDate('');
      setShowDatePicker(false);
    }
  }, [isOpen]);

  const handleDatePresetClick = (preset: DatePreset) => {
    if (datePreset === preset) {
      setDatePreset(null);
    } else {
      setDatePreset(preset);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDatePreset(null);
  };

  const clearDates = () => {
    setDatePreset(null);
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDatePicker(false);
  };

  const hasCustomDates = customStartDate || customEndDate;
  const hasAnyDateFilter = datePreset || hasCustomDates;

  // Format date for display
  const formatDateLabel = () => {
    if (!customStartDate && !customEndDate) return 'Dates';
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} – ${end}`;
    }
    if (customStartDate) {
      return `From ${new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return `Until ${new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleCreatePlan = async (eventId: string) => {
    setCreating(true);
    setSelectedEventId(eventId);
    
    try {
      // Check if user already has a squad for this event
      const checkRes = await fetch(`/api/events/${eventId}/squad`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.squad) {
          // Already has a squad - add friend (if any) and navigate to it
          if (preSelectedFriendId) {
            await fetch(`/api/squads/${data.squad.id}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: preSelectedFriendId }),
            });
            
            showToast({
              message: 'Your friend has been added to your existing plan and notified.',
              type: 'success',
            });
          }
          router.push(`/squads/${data.squad.id}`);
          onClose();
          return;
        }
      }

      // Create new squad
      const createRes = await fetch('/api/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId,
          inviteFriendIds: preSelectedFriendId ? [preSelectedFriendId] : []
        }),
      });

      if (createRes.ok) {
        const data = await createRes.json();
        const selectedEvent = events.find(e => e.id === eventId);
        
        // Show toast based on whether friend was pre-added
        if (preSelectedFriendId) {
          showToast({
            message: `Plan created for ${selectedEvent?.displayTitle || 'event'}. Your friend has been notified.`,
            type: 'success',
            action: {
              label: 'Copy link',
              onClick: () => {
                navigator.clipboard.writeText(`${window.location.origin}/squads/${data.squad.id}`);
              }
            }
          });
        } else {
          showToast({
            message: `Plan created for ${selectedEvent?.displayTitle || 'event'}. Add friends to invite them.`,
            type: 'success',
          });
        }
        
        router.push(`/squads/${data.squad.id}`);
        onClose();
      } else if (createRes.status === 409) {
        // User already has a squad - add friend to it and navigate
        const existingRes = await fetch(`/api/events/${eventId}/squad`);
        if (existingRes.ok) {
          const existingData = await existingRes.json();
          if (existingData.squad) {
            if (preSelectedFriendId) {
              await fetch(`/api/squads/${existingData.squad.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: preSelectedFriendId }),
              });
              
              showToast({
                message: 'Your friend has been added to your existing plan and notified.',
                type: 'success',
                duration: 4000,
              });
            }
            router.push(`/squads/${existingData.squad.id}`);
            onClose();
            return;
          }
        }
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        console.error('Failed to create squad:', errorData.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
    } finally {
      setCreating(false);
      setSelectedEventId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-gray-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Start a Plan
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Pick an event to plan with friends
            </p>
          </div>

          {/* Search + Date Filters */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 space-y-3">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Lady Gaga, indie rock, Moody Center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all"
            />
            
            {/* Date Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Chip
                variant="toggle"
                color="primary"
                size="sm"
                active={datePreset === 'thisWeek'}
                onClick={() => handleDatePresetClick('thisWeek')}
              >
                This Week
              </Chip>
              <Chip
                variant="toggle"
                color="primary"
                size="sm"
                active={datePreset === 'weekend'}
                onClick={() => handleDatePresetClick('weekend')}
              >
                This Weekend
              </Chip>
              
              {/* Date Picker Dropdown */}
              <div className="relative" ref={datePickerRef}>
                <Chip
                  variant="toggle"
                  color="primary"
                  size="sm"
                  active={!!hasCustomDates && !datePreset}
                  onClick={() => setShowDatePicker(!showDatePicker)}
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
                </Chip>
                
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => handleCustomDateChange(e.target.value, customEndDate)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md 
                                   focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => handleCustomDateChange(customStartDate, e.target.value)}
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

              {/* Clear all dates */}
              {hasAnyDateFilter && (
                <button
                  onClick={clearDates}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {debouncedQuery || hasAnyDateFilter 
                  ? 'No events match your search' 
                  : 'No upcoming events'}
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleCreatePlan(event.id)}
                    disabled={creating}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl border text-left
                      transition-all
                      ${selectedEventId === event.id 
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] ring-2 ring-[var(--brand-primary)]/20' 
                        : 'border-gray-200 hover:border-[var(--brand-primary)]/30 hover:bg-gray-50'
                      }
                      ${creating && selectedEventId !== event.id ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                        <img 
                          src={event.imageUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                    )}
                    
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {event.displayTitle}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {event.venue.name} • {formatEventDate(new Date(event.startDateTime))}
                      </p>
                    </div>

                    {/* Loading indicator */}
                    {creating && selectedEventId === event.id && (
                      <div className="flex-shrink-0">
                        <svg className="animate-spin h-5 w-5 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-6 py-3 border-t border-gray-100 bg-[var(--brand-primary-light)] rounded-b-2xl">
            <p className="text-xs text-gray-600 text-center font-medium">
              Select an event to start planning • You can invite friends after
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
