import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteGroupLink } from '@/db/communities';

// DELETE /api/groups/[id] - Delete a group link (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await deleteGroupLink(id, user.dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete group';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

