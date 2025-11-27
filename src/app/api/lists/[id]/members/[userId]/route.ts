import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { removeMemberFromList } from '@/db/lists';

// DELETE /api/lists/[id]/members/[userId] - Remove a member from a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId, userId: memberId } = await params;

    await removeMemberFromList(listId, user.dbUser.id, memberId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove member';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

