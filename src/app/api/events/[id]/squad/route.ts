import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI, handleAPIError } from '@/lib/auth';
import { getUserSquadForEvent } from '@/db/squads';

// GET /api/events/[id]/squad - Check if user has a squad for this event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const user = await requireAuthAPI();

    const squad = await getUserSquadForEvent(user.dbUser.id, eventId);

    return NextResponse.json({
      hasSquad: !!squad,
      squadId: squad?.id || null,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
