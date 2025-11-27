import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { declineInvitation } from '@/db/communities';

// POST /api/communities/[id]/decline - Decline community invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: communityId } = await params;

    const membership = await declineInvitation(communityId, user.dbUser.id);

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error declining invitation:', error);
    const message = error instanceof Error ? error.message : 'Failed to decline invitation';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

