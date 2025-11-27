import { getEvents, groupEventsByDate } from '@/db/events';
import { EventCard } from '@/components/EventCard';
import { Header } from '@/components/Header';
import { formatDateHeading } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function HomePage() {
  // Fetch all upcoming events (no limit, but only future events)
  const events = await getEvents({ limit: 1000 }); // Increased limit to show all events
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Austin Events
          </h1>
          <p className="text-gray-600 mt-2">
            Concerts, comedy, and more happening in Austin, TX
          </p>
        </header>

        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No upcoming events found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((dateKey) => (
              <section key={dateKey}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2">
                  {formatDateHeading(dateKey)}
                </h2>
                <div className="space-y-3">
                  {groupedEvents.get(dateKey)!.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
        </div>
        )}
        </div>
      </main>
    </>
  );
}
