import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserCommunities, getPendingInvitations, createCommunity, getPendingInvitationCount, getCommunityEventStats } from '@/db/communities';

// GET /api/communities - List user's communities and pending invitations
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;

    const [communities, pendingInvitations, pendingCount] = await Promise.all([
      getUserCommunities(userId),
      getPendingInvitations(userId),
      getPendingInvitationCount(userId),
    ]);

    // Fetch event stats for each community
    const communitiesWithStats = await Promise.all(
      communities.map(async (c) => {
        const stats = await getCommunityEventStats(c.id);
        return { ...c, eventStats: stats };
      })
    );

    return NextResponse.json({
      communities: communitiesWithStats,
      pendingInvitations,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
  }
}

// POST /api/communities - Create a new community
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Community name is required' },
        { status: 400 }
      );
    }

    const community = await createCommunity({
      name: name.trim(),
      description: description?.trim() || undefined,
      ownerId: user.dbUser.id,
    });

    return NextResponse.json({ community });
  } catch (error) {
    console.error('Error creating community:', error);
    return NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
  }
}

