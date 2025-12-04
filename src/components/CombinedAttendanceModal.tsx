'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

interface CombinedAttendanceModalProps {
  eventId: string;
  goingCount: number;
  interestedCount: number;
  onClose: () => void;
}

interface Attendee {
  userId: string;
  displayName: string | null;
  email: string;
  status: 'GOING' | 'INTERESTED';
}

export function CombinedAttendanceModal({ eventId, goingCount, interestedCount, onClose }: CombinedAttendanceModalProps) {
  const [goingAttendees, setGoingAttendees] = useState<Attendee[]>([]);
  const [interestedAttendees, setInterestedAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttendees() {
      try {
        // Fetch both statuses in parallel
        const [goingRes, interestedRes] = await Promise.all([
          goingCount > 0 ? fetch(`/api/events/${eventId}/attendees?status=GOING`) : Promise.resolve(null),
          interestedCount > 0 ? fetch(`/api/events/${eventId}/attendees?status=INTERESTED`) : Promise.resolve(null),
        ]);

        if (goingRes && goingRes.ok) {
          const goingData = await goingRes.json();
          setGoingAttendees(goingData.attendees.map((a: any) => ({ ...a, status: 'GOING' as const })));
        }

        if (interestedRes && interestedRes.ok) {
          const interestedData = await interestedRes.json();
          setInterestedAttendees(interestedData.attendees.map((a: any) => ({ ...a, status: 'INTERESTED' as const })));
        }
      } catch (err) {
        setError('Could not load attendees');
      } finally {
        setLoading(false);
      }
    }
    fetchAttendees();
  }, [eventId, goingCount, interestedCount]);

  const totalCount = goingCount + interestedCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-sm w-full shadow-xl border-2 border-gray-200 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {totalCount} {totalCount === 1 ? 'person' : 'people'} {goingCount > 0 && interestedCount > 0 ? 'attending' : goingCount > 0 ? 'going' : 'interested'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Going Section */}
              {goingCount > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {goingCount} {goingCount === 1 ? 'going' : 'going'}
                  </h4>
                  {goingAttendees.length === 0 ? (
                    <div className="text-sm text-gray-500 pl-4">Loading...</div>
                  ) : (
                    <ul className="space-y-2 pl-4">
                      {goingAttendees.map((a) => (
                        <li key={a.userId}>
                          <Link 
                            href={`/users/${a.userId}`}
                            className="flex items-center gap-3 py-1 hover:bg-gray-50 rounded-lg -ml-2 px-2 transition-colors"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={getAvatarStyle(a.userId)}
                            >
                              {getInitials(a.displayName, a.email)}
                            </div>
                            <span className="text-gray-900 text-sm">{getDisplayName(a.displayName, a.email)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Interested Section */}
              {interestedCount > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    {interestedCount} {interestedCount === 1 ? 'interested' : 'interested'}
                  </h4>
                  {interestedAttendees.length === 0 ? (
                    <div className="text-sm text-gray-500 pl-4">Loading...</div>
                  ) : (
                    <ul className="space-y-2 pl-4">
                      {interestedAttendees.map((a) => (
                        <li key={a.userId}>
                          <Link 
                            href={`/users/${a.userId}`}
                            className="flex items-center gap-3 py-1 hover:bg-gray-50 rounded-lg -ml-2 px-2 transition-colors"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={getAvatarStyle(a.userId)}
                            >
                              {getInitials(a.displayName, a.email)}
                            </div>
                            <span className="text-gray-900 text-sm">{getDisplayName(a.displayName, a.email)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

