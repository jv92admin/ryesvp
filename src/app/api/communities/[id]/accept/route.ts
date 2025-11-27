import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { acceptInvitation } from '@/db/communities';

// POST /api/communities/[id]/accept - Accept community invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    const membership = await acceptInvitation(communityId, user.dbUser.id);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept invitation';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

