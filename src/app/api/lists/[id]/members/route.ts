import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { addMemberToList, getFriendsNotInList } from '@/db/lists';

// GET /api/lists/[id]/members - Get friends not in this list (for adding)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId } = await params;

    const availableFriends = await getFriendsNotInList(listId, user.dbUser.id);

    return NextResponse.json({ friends: availableFriends });
  } catch (error) {
    console.error('Error fetching available friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available friends' },
      { status: 500 }
    );
  }
}

// POST /api/lists/[id]/members - Add a friend to a list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: listId } = await params;
    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { error: 'friendId is required' },
        { status: 400 }
      );
    }

    const member = await addMemberToList(listId, user.dbUser.id, friendId);

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Error adding member:', error);
    const message = error instanceof Error ? error.message : 'Failed to add member';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

