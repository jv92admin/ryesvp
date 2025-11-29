import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById, updateSquadLogistics } from '@/db/squads';

// GET /api/squads/[id] - Get squad details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const squad = await getSquadById(id);

    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    // Check if user is a member or if this is a share link access
    const isMember = squad.members.some(member => member.userId === user.dbUser.id);
    
    // For now, allow access if user is a member
    // TODO: Handle share link access for non-members
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this squad' },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      squad,
      currentUserId: user.dbUser.id 
    });
  } catch (error) {
    console.error('Error fetching squad:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad' },
      { status: 500 }
    );
  }
}

// PUT /api/squads/[id] - Update squad logistics
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { meetTime, meetSpot, deadline, playlistUrl } = await req.json();

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    const isMember = squad.members.some(member => member.userId === user.dbUser.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this squad' },
        { status: 403 }
      );
    }

    const updatedSquad = await updateSquadLogistics(id, {
      meetTime: meetTime ? new Date(meetTime) : null,
      meetSpot: meetSpot || null,
      deadline: deadline ? new Date(deadline) : null,
      playlistUrl: playlistUrl || null,
    });

    return NextResponse.json({ squad: updatedSquad });
  } catch (error) {
    console.error('Error updating squad logistics:', error);
    return NextResponse.json(
      { error: 'Failed to update squad logistics' },
      { status: 500 }
    );
  }
}
