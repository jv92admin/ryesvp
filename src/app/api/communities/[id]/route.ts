import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCommunityById, deleteCommunity, getUserMembership } from '@/db/communities';

// GET /api/communities/[id] - Get community details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    const community = await getCommunityById(communityId);

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or member
    const isOwner = community.ownerId === user.dbUser.id;
    const membership = await getUserMembership(communityId, user.dbUser.id);
    const isMember = membership?.status === 'ACTIVE';

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      community,
      isOwner,
      membership,
    });
  } catch (error) {
    console.error('Error fetching community:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id] - Delete a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    await deleteCommunity(communityId, user.dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting community:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete community';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

