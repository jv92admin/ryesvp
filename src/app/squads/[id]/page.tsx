import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';

interface SquadPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Squad page now redirects to the event page with the Plan tab open.
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
