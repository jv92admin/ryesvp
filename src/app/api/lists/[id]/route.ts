import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getListById, updateList, deleteList } from '@/db/lists';

// GET /api/lists/[id] - Get a single list with members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId } = await params;

    const list = await getListById(listId);

    if (!list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }

    // Only owner can view private lists
    if (!list.isPublic && list.ownerId !== user.dbUser.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this list' },
        { status: 403 }
      );
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}

// PUT /api/lists/[id] - Update a list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId } = await params;
    const body = await request.json();
    const { name, description } = body;

    const list = await updateList(listId, user.dbUser.id, {
      name: name?.trim(),
      description: description?.trim(),
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error updating list:', error);
    const message = error instanceof Error ? error.message : 'Failed to update list';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId } = await params;

    await deleteList(listId, user.dbUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete list';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

