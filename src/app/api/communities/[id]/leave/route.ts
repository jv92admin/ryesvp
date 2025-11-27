import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { leaveCommunity } from '@/db/communities';

// POST /api/communities/[id]/leave - Leave a community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    await leaveCommunity(communityId, user.dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving community:', error);
    const message = error instanceof Error ? error.message : 'Failed to leave community';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

