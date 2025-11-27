import { getEventsWithAttendance, groupEventsByDate } from '@/db/events';
import { getAllVenues } from '@/db/venues';
import { EventCard } from '@/components/EventCard';
import { EventFilters } from '@/components/EventFilters';
import { Header } from '@/components/Header';
import { formatDateHeading } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams: Promise<{
    venueId?: string;
    startDate?: string;
    endDate?: string;
    friendsGoing?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const venues = await getAllVenues();
  
  const events = await getEventsWithAttendance({
    venueId: params.venueId || undefined,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate + 'T23:59:59') : undefined,
    friendsGoing: params.friendsGoing === 'true',
    userId: user?.dbUser.id,
    limit: 1000,
  });
  
  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              RyesVP - Events with Friends
            </h1>
            <p className="text-gray-600 mt-2">
              See what's happening. Go together
            </p>
          </header>

          <EventFilters 
            venues={venues} 
            showFriendsFilter={!!user}
          />

          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No events found matching your filters.</p>
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
          
          <p className="text-center text-sm text-gray-500 mt-8">
            Showing {events.length} events
          </p>
        </div>
      </main>
    </>
  );
}
