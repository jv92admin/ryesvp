import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSquadById } from '@/db/squads';
import {
  getSquadPriceGuides,
  createSquadPriceGuide,
  updateSquadPriceGuide,
  deleteSquadPriceGuide,
  getSquadPriceGuideById,
} from '@/db/squadPriceGuide';

// GET /api/squads/[id]/price-guide - Get all price guides for a squad
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
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this plan' },
        { status: 403 }
      );
    }

    const guides = await getSquadPriceGuides(id);
    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Error fetching price guides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price guides' },
      { status: 500 }
    );
  }
}

// POST /api/squads/[id]/price-guide - Add a new price guide entry
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

    const { label, priceMin, priceMax, source } = await req.json();

    if (typeof priceMin !== 'number' || priceMin < 0) {
      return NextResponse.json(
        { error: 'priceMin must be a non-negative number' },
        { status: 400 }
      );
    }

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this plan' },
        { status: 403 }
      );
    }

    const guide = await createSquadPriceGuide({
      squadId: id,
      addedById: user.dbUser.id,
      label,
      priceMin,
      priceMax,
      source,
    });

    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    console.error('Error creating price guide:', error);
    return NextResponse.json(
      { error: 'Failed to create price guide' },
      { status: 500 }
    );
  }
}

// PUT /api/squads/[id]/price-guide - Update a price guide entry
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

    const { guideId, label, priceMin, priceMax, source } = await req.json();

    if (!guideId) {
      return NextResponse.json(
        { error: 'guideId is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this plan' },
        { status: 403 }
      );
    }

    // Verify guide belongs to this squad
    const existingGuide = await getSquadPriceGuideById(guideId);
    if (!existingGuide || existingGuide.squad.id !== id) {
      return NextResponse.json(
        { error: 'Price guide not found' },
        { status: 404 }
      );
    }

    const guide = await updateSquadPriceGuide(guideId, {
      label,
      priceMin,
      priceMax,
      source,
    });

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Error updating price guide:', error);
    return NextResponse.json(
      { error: 'Failed to update price guide' },
      { status: 500 }
    );
  }
}

// DELETE /api/squads/[id]/price-guide - Delete a price guide entry
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

    const { guideId } = await req.json();

    if (!guideId) {
      return NextResponse.json(
        { error: 'guideId is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of this squad
    const squad = await getSquadById(id);
    if (!squad) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const member = squad.members.find(m => m.userId === user.dbUser.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this plan' },
        { status: 403 }
      );
    }

    // Verify guide belongs to this squad
    const existingGuide = await getSquadPriceGuideById(guideId);
    if (!existingGuide || existingGuide.squad.id !== id) {
      return NextResponse.json(
        { error: 'Price guide not found' },
        { status: 404 }
      );
    }

    await deleteSquadPriceGuide(guideId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price guide:', error);
    return NextResponse.json(
      { error: 'Failed to delete price guide' },
      { status: 500 }
    );
  }
}

