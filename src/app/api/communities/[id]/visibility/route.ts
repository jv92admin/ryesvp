import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toggleVisibility } from '@/db/communities';

// PUT /api/communities/[id]/visibility - Toggle visibility in community
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;
    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'isVisible must be a boolean' },
        { status: 400 }
      );
    }

    const membership = await toggleVisibility(communityId, user.dbUser.id, isVisible);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    const message = error instanceof Error ? error.message : 'Failed to update visibility';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

