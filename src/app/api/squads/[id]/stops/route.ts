import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';
import {
  getSquadStops,
  createSquadStop,
  updateSquadStop,
  deleteSquadStop,
  reorderSquadStops,
  getSquadStopById,
} from '@/db/squadStops';

// GET /api/squads/[id]/stops - Get all stops for a squad
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

    const stops = await getSquadStops(id);
    return NextResponse.json({ stops });
  } catch (error) {
    console.error('Error fetching stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stops' },
      { status: 500 }
    );
  }
}

// POST /api/squads/[id]/stops - Add a new stop to the itinerary
export async function POST(
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

    const { label, time, location, notes } = await req.json();

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json(
        { error: 'label is required' },
        { status: 400 }
      );
    }

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

    const stop = await createSquadStop({
      squadId: id,
      addedById: user.dbUser.id,
      label: label.trim(),
      time: time ? new Date(time) : undefined,
      location: location?.trim() || undefined,
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ stop }, { status: 201 });
  } catch (error) {
    console.error('Error creating stop:', error);
    return NextResponse.json(
      { error: 'Failed to create stop' },
      { status: 500 }
    );
  }
}

// PUT /api/squads/[id]/stops - Update a stop or reorder stops
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

    const body = await req.json();
    
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

    // Check if this is a reorder request
    if (body.reorder && Array.isArray(body.stopIds)) {
      const stops = await reorderSquadStops(id, body.stopIds);
      return NextResponse.json({ stops });
    }

    // Otherwise, it's an update request
    const { stopId, label, time, location, notes } = body;

    if (!stopId) {
      return NextResponse.json(
        { error: 'stopId is required' },
        { status: 400 }
      );
    }

    // Verify stop belongs to this squad
    const existingStop = await getSquadStopById(stopId);
    if (!existingStop || existingStop.squad.id !== id) {
      return NextResponse.json(
        { error: 'Stop not found' },
        { status: 404 }
      );
    }

    const stop = await updateSquadStop(stopId, {
      label: label?.trim(),
      time: time ? new Date(time) : (time === null ? null : undefined),
      location: location?.trim() ?? (location === null ? null : undefined),
      notes: notes?.trim() ?? (notes === null ? null : undefined),
    });

    return NextResponse.json({ stop });
  } catch (error) {
    console.error('Error updating stop:', error);
    return NextResponse.json(
      { error: 'Failed to update stop' },
      { status: 500 }
    );
  }
}

// DELETE /api/squads/[id]/stops - Delete a stop
export async function DELETE(
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

    const { stopId } = await req.json();

    if (!stopId) {
      return NextResponse.json(
        { error: 'stopId is required' },
        { status: 400 }
      );
    }

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

    // Verify stop belongs to this squad
    const existingStop = await getSquadStopById(stopId);
    if (!existingStop || existingStop.squad.id !== id) {
      return NextResponse.json(
        { error: 'Stop not found' },
        { status: 404 }
      );
    }

    await deleteSquadStop(stopId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stop:', error);
    return NextResponse.json(
      { error: 'Failed to delete stop' },
      { status: 500 }
    );
  }
}

