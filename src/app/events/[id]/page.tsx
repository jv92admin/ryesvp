import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventDisplay, getEventDetailedSocial } from '@/db/events';
import { Header } from '@/components/Header';
import { AttendanceButton } from '@/components/AttendanceButton';
import { AttendanceSummary } from '@/components/AttendanceSummary';
import { ShareButton } from '@/components/ShareButton';
import { SmartSquadButton } from '@/components/SmartSquadButton';
import { EventSocialSection } from '@/components/EventSocialSection';
import { EventEnrichment } from '@/components/EventEnrichment';
import { InviteBanner } from '@/components/InviteBanner';
import { InviteRedemptionHandler } from '@/components/InviteRedemptionHandler';
import { getCurrentUser } from '@/lib/auth';
import { getUserEventByEventId } from '@/db/userEvents';
import { getEventAttendance } from '@/db/userEvents';
import { getUserSquadForEvent } from '@/db/squads';
import { getEventEnrichment } from '@/db/enrichment';
import { formatInTimeZone } from 'date-fns-tz';
import { isNewListing } from '@/lib/utils';
import { headers } from 'next/headers';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  
  // Use getEventDisplay for canonical event data with displayTitle computed
  const event = await getEventDisplay(id);

  if (!event) {
    notFound();
  }

  // displayTitle is already computed at data layer
  const { displayTitle, enrichment: basicEnrichment } = event;

  // Get current user's attendance status (if logged in)
  const user = await getCurrentUser();
  const userEvent = user ? await getUserEventByEventId(user.dbUser.id, id) : null;
  
  // Get user's squad for this event (if logged in)
  const userSquad = user ? await getUserSquadForEvent(user.dbUser.id, id) : null;
  
  // Get attendance counts
  const attendance = await getEventAttendance(id);
  
  // Get social signals (friends/communities going) if logged in
  const socialSignals = user ? await getEventDetailedSocial(id, user.dbUser.id) : null;
  
  // Get FULL enrichment data for EventEnrichment component (Spotify embed, bio, etc.)
  const fullEnrichment = await getEventEnrichment(id);
  
  // Check if event is new
  const isNew = isNewListing(event.createdAt);
  
  // Get the current URL for sharing
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const eventUrl = `${protocol}://${host}/events/${id}`;
  
  // Format date for share message
  const dateFormatted = formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEEE, MMMM d \'at\' h:mm a');

  const categoryColors: Record<string, string> = {
    CONCERT: 'bg-purple-100 text-purple-800',
    COMEDY: 'bg-yellow-100 text-yellow-800',
    THEATER: 'bg-pink-100 text-pink-800',
    MOVIE: 'bg-red-100 text-red-800',
    SPORTS: 'bg-green-100 text-green-800',
    FESTIVAL: 'bg-orange-100 text-orange-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  const categoryEmojis: Record<string, string> = {
    CONCERT: '🎵',
    COMEDY: '😂',
    THEATER: '🎭',
    MOVIE: '🎬',
    SPORTS: '🏆',
    FESTIVAL: '🎪',
    OTHER: '📅',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Invite Banner - shows for non-logged in users with ?ref= */}
        <InviteBanner isLoggedIn={!!user} />
        
        {/* Invite Redemption Handler - redeems invite after login */}
        {user && <InviteRedemptionHandler />}

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Events
        </Link>

        {/* Hero Image */}
        {event.imageUrl ? (
          <div className="w-full h-48 sm:h-64 md:h-80 rounded-xl overflow-hidden mb-6 shadow-sm">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-64 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
            <span className="text-6xl">{categoryEmojis[event.category] || '📅'}</span>
          </div>
        )}

        {/* Event header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                NEW
              </span>
            )}
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

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {displayTitle}
          </h1>

          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-gray-900">
                  {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">
                  {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'h:mm a')}
                  {event.endDateTime && ` - ${formatInTimeZone(event.endDateTime, AUSTIN_TIMEZONE, 'h:mm a')}`}
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
              <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Action Buttons - Venue & Share always primary */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎟️ Event Venue →
              </a>
            )}
            <ShareButton 
              title={displayTitle}
              venueName={event.venue.name}
              dateFormatted={dateFormatted}
              eventUrl={eventUrl}
              isLoggedIn={!!user}
            />
          </div>

          {/* Ticketmaster - separate section */}
          {basicEnrichment?.tmUrl && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={basicEnrichment.tmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#026CDF' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Buy on Ticketmaster
              </a>
              <p className="mt-2 text-xs text-gray-400">
                Listings shown as found on marketplaces. Check the event venue for official ticket sales.
              </p>
            </div>
          )}
        </div>

        {/* Artist/Event Info from Enrichment */}
        {fullEnrichment && <EventEnrichment enrichment={fullEnrichment} />}

        {/* Social section - Who's going from your network */}
        {socialSignals && <EventSocialSection social={socialSignals} />}

        {/* Attendance section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">What's your status?</h2>
            {/* Attendance summary - tappable to see who */}
            <AttendanceSummary eventId={id} attendance={attendance} />
          </div>
          
          {user ? (
            <div className="space-y-3">
              <AttendanceButton
                eventId={id}
                currentStatus={userEvent?.status || null}
                currentComment={userEvent?.comment || null}
              />
              
              {/* Go Together Button */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">Coordinate with Friends</h3>
                    <p className="text-sm text-gray-600">Create a planning room to coordinate attendance, budgets, and meetups</p>
                  </div>
                  <SmartSquadButton 
                    eventId={id}
                    userSquadId={userSquad?.id}
                    friendsGoing={socialSignals?.friends.filter(f => f.status === 'GOING').length || 0}
                    friendsInterested={socialSignals?.friends.filter(f => f.status === 'INTERESTED').length || 0}
                    event={{
                      id: event.id,
                      title: displayTitle,
                      startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
                      venue: {
                        name: event.venue.name
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  ★ Interested
                </button>
                <button
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  ✓ Going
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  🎫 Need Tickets
                </button>
                <button
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  🎟️ Have Tickets
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link> to mark your status
              </p>
            </div>
          )}
        </div>
      </div>
      </main>
    </>
  );
}

