'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatEventDate } from '@/lib/utils';

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
  preSelectedFriendId?: string; // Optional: pre-select a friend to invite
}

export function StartPlanModal({ isOpen, onClose, preSelectedFriendId }: StartPlanModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch upcoming events (larger limit to include events far in the future)
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Fetch up to 500 events to include events far in the future
        const res = await fetch('/api/events?limit=500');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [isOpen]);

  // Filter events by search query
  const filteredEvents = events.filter(event => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.displayTitle.toLowerCase().includes(query) ||
      event.venue.name.toLowerCase().includes(query)
    );
  });

  const handleCreatePlan = async (eventId: string) => {
    setCreating(true);
    setSelectedEventId(eventId);
    
    try {
      // Check if user already has a squad for this event
      const checkRes = await fetch(`/api/events/${eventId}/squad`);
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.squad) {
          // Already has a squad - navigate to it
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
        router.push(`/squads/${data.squad.id}`);
        onClose();
      } else {
        console.error('Failed to create squad');
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
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Start a Plan
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Pick an event to plan with friends
            </p>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            />
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No events match your search' : 'No upcoming events'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleCreatePlan(event.id)}
                    disabled={creating}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border text-left
                      transition-all
                      ${selectedEventId === event.id 
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      ${creating && selectedEventId !== event.id ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={event.imageUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-xl">📅</span>
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
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500 text-center">
              Select an event to start planning • You can invite friends after
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

