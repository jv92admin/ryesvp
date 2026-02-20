'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { PeopleList } from '@/components/ui';
import type { PeopleGroup } from '@/components/ui';

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
          setGoingAttendees(goingData.attendees);
        }

        if (interestedRes && interestedRes.ok) {
          const interestedData = await interestedRes.json();
          setInterestedAttendees(interestedData.attendees);
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

  const groups: PeopleGroup[] = [
    ...(goingCount > 0
      ? [{
          label: 'going',
          color: 'var(--signal-going)',
          count: goingCount,
          people: goingAttendees.map((a) => ({ id: a.userId, displayName: a.displayName, email: a.email })),
        }]
      : []),
    ...(interestedCount > 0
      ? [{
          label: 'interested',
          color: 'var(--signal-interested)',
          count: interestedCount,
          people: interestedAttendees.map((a) => ({ id: a.userId, displayName: a.displayName, email: a.email })),
        }]
      : []),
  ];

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="sm">
      <DialogHeader onClose={onClose}>
        <DialogTitle>
          {totalCount} {totalCount === 1 ? 'person' : 'people'} {goingCount > 0 && interestedCount > 0 ? 'attending' : goingCount > 0 ? 'going' : 'interested'}
        </DialogTitle>
      </DialogHeader>

      <DialogBody>
        {loading ? (
          <div className="text-center py-4 text-[var(--text-muted)]">Loading...</div>
        ) : error ? (
          <div className="text-center py-4 text-[var(--signal-danger)]">{error}</div>
        ) : (
          <PeopleList groups={groups} linkToProfile />
        )}
      </DialogBody>
    </Dialog>
  );
}
