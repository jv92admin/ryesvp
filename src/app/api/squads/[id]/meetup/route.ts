import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';
import prisma from '@/db/prisma';

// PUT /api/squads/[id]/meetup - Update meetup time and spot
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

    const { meetTime, meetSpot } = await req.json();

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Squad not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this squad' },
        { status: 403 }
      );
    }

    // Update the squad
    const updatedSquad = await prisma.squad.update({
      where: { id },
      data: {
        meetTime: meetTime ? new Date(meetTime) : null,
        meetSpot: meetSpot || null,
      },
    });

    return NextResponse.json({ 
      success: true,
      meetTime: updatedSquad.meetTime?.toISOString() || null,
      meetSpot: updatedSquad.meetSpot,
    });
  } catch (error) {
    console.error('Error updating meetup:', error);
    return NextResponse.json(
      { error: 'Failed to update meetup' },
      { status: 500 }
    );
  }
}

