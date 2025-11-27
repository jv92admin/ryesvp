import { requireAuth } from '@/lib/auth';
import { Header } from '@/components/Header';
import { EventCard } from '@/components/EventCard';
import { getUserEvents, type UserEventWithEvent } from '@/db/userEvents';
import { groupEventsByDate, type EventWithVenue } from '@/db/events';
import { formatDateHeading } from '@/lib/utils';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await requireAuth();
  const userEvents = await getUserEvents(user.dbUser.id);
  
  // Separate by status and extract events with comments
  const goingEvents: (EventWithVenue & { comment: string | null })[] = userEvents
    .filter(ue => ue.status === 'GOING')
    .map(ue => ({ ...ue.event, comment: ue.comment }));
  const interestedEvents: (EventWithVenue & { comment: string | null })[] = userEvents
    .filter(ue => ue.status === 'INTERESTED')
    .map(ue => ({ ...ue.event, comment: ue.comment }));
  
  const goingGrouped = groupEventsByDate(goingEvents);
  const interestedGrouped = groupEventsByDate(interestedEvents);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

          {/* User info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.supabaseUser.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.dbUser.displayName || 'No display name'}</p>
                <p className="text-gray-600">{user.supabaseUser.email}</p>
              </div>
            </div>
          </div>

          {/* Going section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Events I'm Going To ({goingEvents.length})
            </h2>
            {goingEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                <p>No events yet</p>
                <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Browse events →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(goingGrouped.keys()).sort().map((dateKey) => (
                  <div key={dateKey}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {formatDateHeading(dateKey)}
                    </h3>
                    <div className="space-y-3">
                      {goingGrouped.get(dateKey)!.map((event) => {
                        const userEvent = userEvents.find(ue => ue.eventId === event.id);
                        return (
                          <div key={event.id}>
                            <EventCard event={event} />
                            {userEvent?.comment && (
                              <div className="ml-4 mt-1 text-sm text-gray-600">
                                💬 {userEvent.comment}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Interested section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Events I'm Interested In ({interestedEvents.length})
            </h2>
            {interestedEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                <p>No events yet</p>
                <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Browse events →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(interestedGrouped.keys()).sort().map((dateKey) => (
                  <div key={dateKey}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {formatDateHeading(dateKey)}
                    </h3>
                    <div className="space-y-3">
                      {interestedGrouped.get(dateKey)!.map((event) => {
                        const userEvent = userEvents.find(ue => ue.eventId === event.id);
                        return (
                          <div key={event.id}>
                            <EventCard event={event} />
                            {userEvent?.comment && (
                              <div className="ml-4 mt-1 text-sm text-gray-600">
                                💬 {userEvent.comment}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

