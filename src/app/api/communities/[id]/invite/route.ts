import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { inviteToCommunity, getInvitableFriends } from '@/db/communities';

// GET /api/communities/[id]/invite - Get friends who can be invited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    const friends = await getInvitableFriends(communityId, user.dbUser.id);

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Error fetching invitable friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST /api/communities/[id]/invite - Invite a friend to community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;
    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      );
    }

    const membership = await inviteToCommunity(communityId, user.dbUser.id, friendId);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error inviting to community:', error);
    const message = error instanceof Error ? error.message : 'Failed to invite';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

