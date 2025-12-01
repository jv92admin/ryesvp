'use client';

import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface TicketActivity {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  friendId: string;
  friendName: string;
  status: 'NEED_TICKETS' | 'HAVE_TICKETS';
}

interface SocialSectionCProps {
  ticketActivity: TicketActivity[];
}

export function SocialSectionC({ ticketActivity }: SocialSectionCProps) {
  // Group by event for cleaner display
  const groupedActivity = ticketActivity.reduce((acc, activity) => {
    if (!acc[activity.eventId]) {
      acc[activity.eventId] = {
        eventTitle: activity.eventTitle,
        eventDate: activity.eventDate,
        venueName: activity.venueName,
        needTickets: [],
        haveTickets: [],
      };
    }
    
    if (activity.status === 'NEED_TICKETS') {
      acc[activity.eventId].needTickets.push({
        friendId: activity.friendId,
        friendName: activity.friendName,
      });
    } else {
      acc[activity.eventId].haveTickets.push({
        friendId: activity.friendId,
        friendName: activity.friendName,
      });
    }
    
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-fit">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-[var(--brand-primary)] uppercase tracking-wide">
          Ticket activity
        </h2>
      </div>
      
      {/* Content */}
      <div className="divide-y divide-gray-100">
        {ticketActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500 px-4">
            <p className="text-sm mb-2">No ticket activity in your network.</p>
            <p className="text-xs">Connect with friends to see who needs or has tickets.</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedActivity).map(([eventId, event]) => (
              <div key={eventId} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <Link
                  href={`/events/${eventId}`}
                  className="font-medium text-gray-900 text-sm hover:text-[var(--brand-primary)] block"
                >
                  {event.eventTitle}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                  {formatInTimeZone(new Date(event.eventDate), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')} • {event.venueName}
                </p>
                
                {/* Ticket status summary */}
                <div className="flex flex-wrap gap-2">
                  {event.needTickets.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        Need
                      </span>
                      <span className="text-xs text-gray-600">
                        {event.needTickets.map((friend: any) => friend.friendName).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {event.haveTickets.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                        Have
                      </span>
                      <span className="text-xs text-gray-600">
                        {event.haveTickets.map((friend: any) => friend.friendName).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {ticketActivity.length >= 20 && (
              <div className="text-center py-3 px-4">
                <p className="text-xs text-gray-500">
                  Showing recent activity from the next 2 weeks
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
