import Link from 'next/link';
import { EventWithVenue } from '@/db/events';
import { formatEventDate, isNewListing } from '@/lib/utils';

interface EventCardProps {
  event: EventWithVenue;
}

export function EventCard({ event }: EventCardProps) {
  const isNew = isNewListing(event.createdAt);
  
  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const categoryEmojis: Record<string, string> = {
    CONCERT: '🎵',
    COMEDY: '😂',
    THEATER: '🎭',
    SPORTS: '🏆',
    FESTIVAL: '🎪',
    OTHER: '📅',
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
      <div className="flex gap-4">
        {/* Event Image */}
        {event.imageUrl ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-3xl">{categoryEmojis[event.category] || '📅'}</span>
          </div>
        )}
        
        {/* Event Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                NEW
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {statusBadge}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
            {event.title}
          </h3>
          
          {/* Venue */}
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <span className="text-gray-400">📍</span>
            {event.venue.name}
          </p>
          
          {/* Date */}
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <span className="text-gray-400">📅</span>
            {formatEventDate(event.startDateTime)}
          </p>
        </div>
      </div>
    </Link>
  );
}

