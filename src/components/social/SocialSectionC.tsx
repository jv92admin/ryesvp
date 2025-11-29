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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🎫 Ticket Activity</h2>
      
      {ticketActivity.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm mb-2">No ticket activity in your network.</p>
          <p className="text-xs">Connect with friends to see who needs or has tickets.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedActivity).map(([eventId, event]) => (
            <div key={eventId} className="p-4 border border-gray-100 rounded-lg">
              <Link
                href={`/events/${eventId}`}
                className="font-medium text-gray-900 hover:text-blue-600 block mb-2"
              >
                {event.eventTitle}
              </Link>
              <p className="text-sm text-gray-600 mb-3">
                {formatInTimeZone(new Date(event.eventDate), AUSTIN_TIMEZONE, 'EEE, MMM d • h:mm a')}
                {' • '}
                {event.venueName}
              </p>
              
              {/* Ticket status summary */}
              <div className="space-y-2">
                {event.needTickets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                      🔍 Need Tickets
                    </span>
                    <span className="text-sm text-gray-600">
                      {event.needTickets.map((friend: any) => friend.friendName).join(', ')}
                    </span>
                  </div>
                )}
                
                {event.haveTickets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                      ✅ Have Tickets
                    </span>
                    <span className="text-sm text-gray-600">
                      {event.haveTickets.map((friend: any) => friend.friendName).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {ticketActivity.length >= 20 && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Showing recent activity from the next 2 weeks
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
