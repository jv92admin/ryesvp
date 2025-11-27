import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCommunityEvents } from '@/db/communities';

// GET /api/communities/[id]/events - Get events where community members are going
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    const result = await getCommunityEvents(communityId, user.dbUser.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching community events:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

