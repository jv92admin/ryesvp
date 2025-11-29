'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { AttendeeListModal } from './AttendeeListModal';

interface AttendanceSummaryProps {
  eventId: string;
  attendance: {
    going: number;
    interested: number;
    needTickets: number;
    haveTickets: number;
  };
}

type StatusConfig = {
  status: AttendanceStatus;
  count: number;
  label: string;
  labelSingular: string;
  colorClass: string;
};

export function AttendanceSummary({ eventId, attendance }: AttendanceSummaryProps) {
  const [modalStatus, setModalStatus] = useState<StatusConfig | null>(null);

  const statuses: StatusConfig[] = [
    {
      status: 'GOING',
      count: attendance.going,
      label: 'going',
      labelSingular: 'going',
      colorClass: 'text-green-700 hover:text-green-900 hover:underline cursor-pointer',
    },
    {
      status: 'INTERESTED',
      count: attendance.interested,
      label: 'interested',
      labelSingular: 'interested',
      colorClass: 'text-yellow-700 hover:text-yellow-900 hover:underline cursor-pointer',
    },
    {
      status: 'NEED_TICKETS',
      count: attendance.needTickets,
      label: 'need tickets',
      labelSingular: 'needs tickets',
      colorClass: 'text-blue-700 hover:text-blue-900 hover:underline cursor-pointer',
    },
    {
      status: 'HAVE_TICKETS',
      count: attendance.haveTickets,
      label: 'have tickets',
      labelSingular: 'has tickets',
      colorClass: 'text-purple-700 hover:text-purple-900 hover:underline cursor-pointer',
    },
  ];

  const visibleStatuses = statuses.filter((s) => s.count > 0);

  if (visibleStatuses.length === 0) {
    return <p className="text-sm text-gray-500">Be the first to mark your status!</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {visibleStatuses.map((s) => (
          <button
            key={s.status}
            onClick={() => setModalStatus(s)}
            className={s.colorClass}
          >
            {s.count} {s.count === 1 ? s.labelSingular : s.label}
          </button>
        ))}
      </div>

      {modalStatus && (
        <AttendeeListModal
          eventId={eventId}
          status={modalStatus.status}
          label={modalStatus.count === 1 ? modalStatus.labelSingular : modalStatus.label}
          count={modalStatus.count}
          onClose={() => setModalStatus(null)}
        />
      )}
    </>
  );
}

