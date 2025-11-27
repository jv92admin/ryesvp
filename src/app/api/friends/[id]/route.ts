import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { removeFriend } from '@/db/friends';

// DELETE /api/friends/[id] - Remove a friend
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: friendshipId } = await params;

    await removeFriend(friendshipId, user.dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove friend';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

