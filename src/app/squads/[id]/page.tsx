import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SquadPageProps {
  params: Promise<{ id: string }>;
}

/**
 * OG metadata for plan links shared on WhatsApp/iMessage/etc.
 * Shows the event image + "Plan for {event}" so the preview card
 * is useful even though the page itself redirects.
 */
export async function generateMetadata({ params }: SquadPageProps): Promise<Metadata> {
  const { id } = await params;
  const squad = await getSquadById(id);

  if (!squad) return {};

  const dateFormatted = formatInTimeZone(
    squad.event.startDateTime,
    AUSTIN_TIMEZONE,
    'EEEE, MMMM d · h:mm a'
  );

  const title = `Plan: ${squad.event.displayTitle} — Lark`;
  const description = `${squad.event.venue.name} · ${dateFormatted}`;

  const images = squad.event.imageUrl
    ? [{ url: squad.event.imageUrl, width: 1200, height: 630 }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

/**
 * Squad page redirects to the event page with the Plan tab open.
 * The plan experience lives inline on the event page (EventPlanPanel).
 * This redirect handles: bookmarks, shared links, notification clicks.
 */
export default async function SquadPageRoute({ params }: SquadPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?returnUrl=/squads/${id}`);
  }

  const squad = await getSquadById(id);

  if (!squad) {
    notFound();
  }

  // Everyone goes to the event page — members see Plan tab, non-members see discovery
  redirect(`/events/${squad.eventId}?tab=plan`);
}
