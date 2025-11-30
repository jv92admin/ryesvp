import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';
import { getEventEnrichment } from '@/db/enrichment';
import { SquadPage } from '@/components/squad/SquadPage';

interface SquadPageProps {
  params: Promise<{ id: string }>;
}

export default async function SquadPageRoute({ params }: SquadPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    // Redirect to login or show 404? For now, 404
    notFound();
  }

  const squad = await getSquadById(id);

  if (!squad) {
    notFound();
  }

  // Check if user is a member
  const isMember = squad.members.some(member => member.userId === user.dbUser.id);

  if (!isMember) {
    // Non-members get 404 (as per user's answer)
    notFound();
  }

  // Fetch full enrichment for "Know-before-you-go" details
  const enrichment = await getEventEnrichment(squad.eventId);

  // Serialize dates for client component
  const serializedSquad = {
    ...squad,
    meetTime: squad.meetTime?.toISOString() || null,
    meetSpot: squad.meetSpot,
    deadline: squad.deadline?.toISOString() || null,
    playlistUrl: squad.playlistUrl,
    event: {
      ...squad.event,
      startDateTime: squad.event.startDateTime.toISOString(),
    },
    members: squad.members.map(member => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    })),
  };

  return (
    <SquadPage
      squad={serializedSquad}
      currentUserId={user.dbUser.id}
      enrichment={enrichment}
    />
  );
}

