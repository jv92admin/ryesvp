import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEventDisplay, getEventDetailedSocial } from '@/db/events';
import { Header } from '@/components/Header';
import { ShareButton } from '@/components/ShareButton';
import { FriendsAndStatusCard } from '@/components/FriendsAndStatusCard';
import { PrimaryCTACard } from '@/components/PrimaryCTACard';
import { AboutCard } from '@/components/AboutCard';
import { ExploreCard } from '@/components/ExploreCard';
import { InviteBanner } from '@/components/InviteBanner';
import { InviteRedemptionHandler } from '@/components/InviteRedemptionHandler';
import { PerformerLink } from '@/components/PerformerLink';
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
  
  // Get FULL enrichment data for ExploreCard (Spotify, artist image, bio, etc.)
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

        {/* Back link and Share button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">All Events</span>
          </Link>
          <ShareButton 
            title={displayTitle}
            venueName={event.venue.name}
            dateFormatted={dateFormatted}
            eventUrl={eventUrl}
            isLoggedIn={!!user}
          />
        </div>

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

        {/* Event header - tightened */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
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

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {displayTitle}
          </h1>

          {/* Main Performer - clickable to open modal */}
          {event.performer && (
            <div className="text-sm text-gray-600 mb-2">
              by <PerformerLink performerId={event.performer.id} performerName={event.performer.name} />
            </div>
          )}

          {/* Supporting Acts */}
          {fullEnrichment?.tmSupportingActs && fullEnrichment.tmSupportingActs.length > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              With: {fullEnrichment.tmSupportingActs.join(', ')}
            </p>
          )}

          {/* Compact date + time on single line */}
          <div className="text-sm sm:text-base text-gray-600 mb-2">
            <span className="font-medium">
              {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d')}
              {' • '}
              {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'h:mm a')}
              {event.endDateTime && ` - ${formatInTimeZone(event.endDateTime, AUSTIN_TIMEZONE, 'h:mm a')}`}
            </span>
          </div>

          {/* Compact venue with location pin and event website link */}
          <div className="text-sm sm:text-base text-gray-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">📍</span>
              <span className="font-medium">{event.venue.name}</span>
              {event.venue.city && event.venue.state && (
                <span className="text-gray-500">, {event.venue.city}, {event.venue.state}</span>
              )}
              {event.url && (
                <>
                  <span className="text-gray-300">•</span>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    Visit event website
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Friends & Status Card */}
        <FriendsAndStatusCard
          eventId={id}
          socialSignals={socialSignals}
          attendance={attendance}
          userEvent={userEvent}
          userSquad={userSquad}
          event={{
            id: event.id,
            title: displayTitle,
            startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
            venue: {
              name: event.venue.name
            }
          }}
          isLoggedIn={!!user}
        />

        {/* Buy and Explore - side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PrimaryCTACard
            tmUrl={basicEnrichment?.tmUrl}
          />
          <ExploreCard enrichment={fullEnrichment} />
        </div>

        {/* About Card - last */}
        <AboutCard
          description={event.description}
          venue={event.venue}
        />
      </div>
      </main>
    </>
  );
}

