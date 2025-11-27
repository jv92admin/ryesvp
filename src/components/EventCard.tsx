import Link from 'next/link';
import { EventWithVenue } from '@/db/events';
import { formatEventDate } from '@/lib/utils';

interface EventCardProps {
  event: EventWithVenue;
}

export function EventCard({ event }: EventCardProps) {
  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const statusBadge = event.status !== 'SCHEDULED' && (
    <span className={`
      px-2 py-0.5 text-xs font-medium rounded
      ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
      ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 line-through' : ''}
      ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
    `}>
      {event.status.replace('_', ' ')}
    </span>
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {statusBadge}
          </div>
          
          <h3 className="font-semibold text-gray-900 truncate">
            {event.title}
          </h3>
          
          <p className="text-sm text-gray-600 mt-1">
            {event.venue.name}
          </p>
          
          <p className="text-sm text-gray-500 mt-1">
            {formatEventDate(event.startDateTime)}
          </p>
        </div>
      </div>
    </Link>
  );
}

