import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventById } from '@/db/events';
import { Header } from '@/components/Header';
import { AttendanceButton } from '@/components/AttendanceButton';
import { getCurrentUser } from '@/lib/auth';
import { getUserEventByEventId } from '@/db/userEvents';
import { getEventAttendance } from '@/db/userEvents';
import { format } from 'date-fns';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  // Get current user's attendance status (if logged in)
  const user = await getCurrentUser();
  const userEvent = user ? await getUserEventByEventId(user.dbUser.id, id) : null;
  
  // Get attendance counts
  const attendance = await getEventAttendance(id);

  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to events
        </Link>

        {/* Event header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColors[event.category]}`}>
              {event.category}
            </span>
            {event.status !== 'SCHEDULED' && (
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded
                ${event.status === 'SOLD_OUT' ? 'bg-red-100 text-red-800' : ''}
                ${event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                ${event.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' : ''}
              `}>
                {event.status.replace('_', ' ')}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">
                  {format(event.startDateTime, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">
                  {format(event.startDateTime, 'h:mm a')}
                  {event.endDateTime && ` - ${format(event.endDateTime, 'h:mm a')}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium text-gray-900">{event.venue.name}</p>
                {event.venue.address && (
                  <p className="text-sm">{event.venue.address}, {event.venue.city}, {event.venue.state}</p>
                )}
              </div>
            </div>
          </div>

          {event.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {event.url && (
            <div className="mt-6">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Tickets →
              </a>
            </div>
          )}
        </div>

        {/* Attendance section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Are you going?</h2>
            {(attendance.going > 0 || attendance.interested > 0) && (
              <p className="text-sm text-gray-600">
                {attendance.going} going{attendance.going !== 1 ? '' : ''} • {attendance.interested} interested
              </p>
            )}
          </div>
          
          {user ? (
            <AttendanceButton
              eventId={id}
              currentStatus={userEvent?.status || null}
              currentComment={userEvent?.comment || null}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                >
                  ✓ Going
                </button>
                <button
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                >
                  ★ Interested
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link> to mark your attendance
              </p>
            </div>
          )}
        </div>
      </div>
      </main>
    </>
  );
}

