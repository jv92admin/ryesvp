import { notFound } from 'next/navigation';
import { getEventDisplay, getEventDetailedSocial } from '@/db/events';
import { BackToEventsLink } from '@/components/BackToEventsLink';
import { Header } from '@/components/Header';
import { ShareButton } from '@/components/ShareButton';
import { EventActionBar } from '@/components/EventActionBar';
import { SocialProofCard } from '@/components/SocialProofCard';
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
import { categoryColors, eventStatusConfig } from '@/lib/constants';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  const event = await getEventDisplay(id);
  if (!event) notFound();

  const { displayTitle, enrichment: basicEnrichment } = event;

  const user = await getCurrentUser();
  const userEvent = user ? await getUserEventByEventId(user.dbUser.id, id) : null;
  const userSquad = user ? await getUserSquadForEvent(user.dbUser.id, id) : null;
  const attendance = await getEventAttendance(id);
  const socialSignals = user ? await getEventDetailedSocial(id, user.dbUser.id) : null;
  const fullEnrichment = await getEventEnrichment(id);
  const isNew = isNewListing(event.createdAt);

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const eventUrl = `${protocol}://${host}/events/${id}`;
  const dateFormatted = formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEEE, MMMM d \'at\' h:mm a');

  const tmUrl = basicEnrichment?.tmUrl;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <InviteBanner isLoggedIn={!!user} />
        {user && <InviteRedemptionHandler />}

        {/* Navigation: back + share */}
        <div className="flex items-center justify-between mb-6">
          <BackToEventsLink />
          <ShareButton
            title={displayTitle}
            venueName={event.venue.name}
            dateFormatted={dateFormatted}
            eventUrl={eventUrl}
            isLoggedIn={!!user}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors"
          />
        </div>

        {/* Hero Image */}
        {event.imageUrl ? (
          <div className="w-full h-56 sm:h-72 md:h-80 rounded-xl overflow-hidden mb-6">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-64 rounded-xl bg-gradient-to-br from-[var(--surface-inset)] to-[var(--border-default)] flex items-center justify-center mb-6">
            <span className="text-lg font-medium text-[var(--text-muted)] uppercase tracking-wider">{event.category}</span>
          </div>
        )}

        {/* Event metadata */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-[var(--action-primary)] text-[var(--action-primary-text)] rounded">
                NEW
              </span>
            )}
            <span className={`text-xs font-semibold uppercase tracking-wide ${categoryColors[event.category] || 'text-[var(--text-secondary)]'}`}>
              {event.category}
            </span>
            {event.status !== 'SCHEDULED' && eventStatusConfig[event.status as keyof typeof eventStatusConfig] && (
              <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded ${eventStatusConfig[event.status as keyof typeof eventStatusConfig].colors}`}>
                {eventStatusConfig[event.status as keyof typeof eventStatusConfig].label}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1 leading-snug">
            {displayTitle}
          </h1>

          {event.performer && (
            <div className="text-sm text-[var(--text-secondary)] mb-2">
              by <PerformerLink performerId={event.performer.id} performerName={event.performer.name} />
            </div>
          )}

          {fullEnrichment?.tmSupportingActs && fullEnrichment.tmSupportingActs.length > 0 && (
            <p className="text-sm text-[var(--text-muted)] mb-3">
              With: {fullEnrichment.tmSupportingActs.join(', ')}
            </p>
          )}

          <div className="text-sm sm:text-base text-[var(--text-secondary)] mb-2">
            <span className="font-medium">
              {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEE, MMM d')}
              {' · '}
              {formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'h:mm a')}
              {event.endDateTime && ` – ${formatInTimeZone(event.endDateTime, AUSTIN_TIMEZONE, 'h:mm a')}`}
            </span>
          </div>

          <div className="text-sm sm:text-base text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="font-medium">{event.venue.name}</span>
              {event.venue.city && event.venue.state && (
                <span className="text-[var(--text-muted)]">, {event.venue.city}, {event.venue.state}</span>
              )}
            </div>
          </div>
        </div>

        {/* Social proof — inline, not a card */}
        <SocialProofCard
          eventId={id}
          socialSignals={socialSignals}
          attendance={attendance}
          userSquad={userSquad}
          event={{
            id: event.id,
            title: displayTitle,
            startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
            venue: { name: event.venue.name }
          }}
          isLoggedIn={!!user}
        />

        {/* Explore */}
        <div className="mb-6">
          <ExploreCard enrichment={fullEnrichment} />
        </div>

        {/* About — includes event website link */}
        <AboutCard
          description={event.description}
          venue={event.venue}
          eventUrl={event.url}
        />
      </div>
      </main>

      {/* Sticky action bar — always visible at bottom */}
      <EventActionBar
        eventId={id}
        initialStatus={userEvent?.status || null}
        isLoggedIn={!!user}
        buyUrl={tmUrl}
      />
    </>
  );
}
