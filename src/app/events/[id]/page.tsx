import { notFound } from 'next/navigation';
import { getEventDisplay, getEventDetailedSocial } from '@/db/events';
import { Header } from '@/components/Header';
import { EventHero } from '@/components/EventHero';
import { EventActionBar } from '@/components/EventActionBar';
import { SocialProofCard } from '@/components/SocialProofCard';
import { EventContentTabs } from '@/components/EventContentTabs';
import { AboutCard } from '@/components/AboutCard';
import { ExploreCard } from '@/components/ExploreCard';
import { InviteBanner } from '@/components/InviteBanner';
import { InviteRedemptionHandler } from '@/components/InviteRedemptionHandler';
import { getCurrentUser } from '@/lib/auth';
import { getUserEventByEventId } from '@/db/userEvents';
import { getEventAttendance } from '@/db/userEvents';
import { getUserSquadForEvent } from '@/db/squads';
import { getEventEnrichment } from '@/db/enrichment';
import { formatInTimeZone } from 'date-fns-tz';
import { headers } from 'next/headers';

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

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const eventUrl = `${protocol}://${host}/events/${id}`;
  const dateFormatted = formatInTimeZone(event.startDateTime, AUSTIN_TIMEZONE, 'EEEE, MMMM d \'at\' h:mm a');

  const tmUrl = basicEnrichment?.tmUrl;

  // Shared event object for client components
  const eventObj = {
    id: event.id,
    title: displayTitle,
    startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
    venue: { name: event.venue.name },
  };

  // Serialized event data for EventHero
  const heroEvent = {
    imageUrl: event.imageUrl,
    title: event.title,
    displayTitle,
    category: event.category,
    status: event.status,
    performer: event.performer ? { id: event.performer.id, name: event.performer.name } : null,
    startDateTime: typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString(),
    endDateTime: event.endDateTime
      ? (typeof event.endDateTime === 'string' ? event.endDateTime : event.endDateTime.toISOString())
      : null,
    venue: { name: event.venue.name, city: event.venue.city, state: event.venue.state },
    createdAt: typeof event.createdAt === 'string' ? event.createdAt : event.createdAt.toISOString(),
  };

  const hasFriendsGoing = (socialSignals?.friends.filter(f => f.status === 'GOING').length || 0) > 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--surface-bg)]">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
          <InviteBanner isLoggedIn={!!user} />
          {user && <InviteRedemptionHandler />}

          {/* Integrated Hero: image + overlay nav + metadata + inline attendance */}
          <EventHero
            event={heroEvent}
            supportingActs={fullEnrichment?.tmSupportingActs || null}
            eventId={id}
            initialStatus={userEvent?.status || null}
            isLoggedIn={!!user}
            shareProps={{ title: displayTitle, venueName: event.venue.name, dateFormatted, eventUrl }}
          />

          {/* Social proof — friends + Start Plan CTA for State B */}
          <SocialProofCard
            eventId={id}
            socialSignals={socialSignals}
            attendance={attendance}
            userSquad={userSquad}
            event={eventObj}
            isLoggedIn={!!user}
          />

          {/* Content: Tabbed (Plan/Explore) for State A, Linear for State B/C */}
          {userSquad ? (
            <EventContentTabs
              squadId={userSquad.id}
              eventId={id}
              displayTitle={displayTitle}
              startDateTime={typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString()}
              enrichment={fullEnrichment}
              description={event.description}
              venue={event.venue}
              eventUrl={event.url}
              buyUrl={tmUrl}
            />
          ) : (
            <>
              <ExploreCard enrichment={fullEnrichment} />
              <AboutCard
                description={event.description}
                venue={event.venue}
                eventUrl={event.url}
                buyUrl={tmUrl}
              />
            </>
          )}
        </div>
      </main>

      {/* State-dependent sticky bar */}
      <EventActionBar
        isLoggedIn={!!user}
        hasSquad={!!userSquad}
        squadId={userSquad?.id || null}
        hasFriendsGoing={hasFriendsGoing}
        event={eventObj}
      />
    </>
  );
}
