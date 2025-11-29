'use client';

import { useState, useEffect } from 'react';
import { AttendanceStatus } from '@prisma/client';

interface AttendeeListModalProps {
  eventId: string;
  status: AttendanceStatus;
  label: string;
  count: number;
  onClose: () => void;
}

const STATUS_STYLES = {
  GOING: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  INTERESTED: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  NEED_TICKETS: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  HAVE_TICKETS: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  NOT_GOING: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
};

export function AttendeeListModal({ eventId, status, label, count, onClose }: AttendeeListModalProps) {
  const [attendees, setAttendees] = useState<{ userId: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = STATUS_STYLES[status];

  useEffect(() => {
    async function fetchAttendees() {
      try {
        const res = await fetch(`/api/events/${eventId}/attendees?status=${status}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setAttendees(data.attendees);
      } catch (err) {
        setError('Could not load attendees');
      } finally {
        setLoading(false);
      }
    }
    fetchAttendees();
  }, [eventId, status]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`bg-white rounded-xl max-w-sm w-full shadow-xl ${styles.border} border-2`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${styles.bg} px-4 py-3 rounded-t-xl border-b ${styles.border}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${styles.text}`}>
              {count} {label}
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
        <div className="p-4 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No one yet</div>
          ) : (
            <ul className="space-y-2">
              {attendees.map((a) => (
                <li key={a.userId} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {a.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-900">{a.displayName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

