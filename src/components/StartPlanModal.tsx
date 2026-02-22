'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatEventDate } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { Chip } from '@/components/ui';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

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
          router.push(`/events/${eventId}?tab=plan`);
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

        router.push(`/events/${eventId}?tab=plan`);
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
            router.push(`/events/${eventId}?tab=plan`);
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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()} size="lg">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Start a Plan</DialogTitle>
        <p className="text-sm text-[var(--lark-text-secondary)] mt-1">
          Pick an event to plan with friends
        </p>
      </DialogHeader>

      {/* Search + Date Filters */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3 flex-shrink-0">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Lady Gaga, indie rock, Moody Center..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 border border-[var(--border-subtle)] rounded-xl text-sm bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:border-transparent transition-all"
        />

        {/* Date Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Chip
            variant="toggle"
            size="sm"
            active={datePreset === 'thisWeek'}
            onClick={() => handleDatePresetClick('thisWeek')}
          >
            This Week
          </Chip>
          <Chip
            variant="toggle"
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
              <div className="absolute top-full left-0 mt-1 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg  z-20 min-w-[200px]">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-[var(--lark-text-muted)] mb-1">From</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => handleCustomDateChange(e.target.value, customEndDate)}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded-md
                               focus:outline-none focus:ring-1 focus:ring-[var(--border-visible)] focus:border-[var(--border-visible)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--lark-text-muted)] mb-1">To</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => handleCustomDateChange(customStartDate, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border-subtle)] rounded-md
                               focus:outline-none focus:ring-1 focus:ring-[var(--border-visible)] focus:border-[var(--border-visible)]"
                    />
                  </div>
                  {hasCustomDates && (
                    <button
                      type="button"
                      onClick={clearDates}
                      className="w-full text-xs text-[var(--lark-text-muted)] hover:text-[var(--lark-text-secondary)] mt-1"
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
              className="text-xs text-[var(--lark-text-muted)] hover:text-[var(--lark-text-secondary)] ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Event List */}
      <DialogBody>
        {loading ? (
          <div className="text-center py-8 text-[var(--lark-text-muted)]">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-[var(--lark-text-muted)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Searching events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-[var(--lark-text-muted)]">
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
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20'
                    : 'border-[var(--border-subtle)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-hover)]'
                  }
                  ${creating && selectedEventId !== event.id ? 'opacity-50' : ''}
                `}
              >
                {/* Event Image */}
                {event.imageUrl ? (
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--bg-surface)] ring-1 ring-[var(--border-subtle)]">
                    <img
                      src={event.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--lark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                )}

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--lark-text-primary)] truncate">
                    {event.displayTitle}
                  </p>
                  <p className="text-sm text-[var(--lark-text-muted)] truncate">
                    {event.venue.name} • {formatEventDate(new Date(event.startDateTime))}
                  </p>
                </div>

                {/* Loading indicator */}
                {creating && selectedEventId === event.id && (
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogBody>

      {/* Footer hint */}
      <DialogFooter className="justify-center">
        <p className="text-xs text-[var(--lark-text-secondary)] text-center font-medium">
          Select an event to start planning • You can invite friends after
        </p>
      </DialogFooter>
    </Dialog>
  );
}
