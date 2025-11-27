import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrivateLists, createList } from '@/db/lists';

// GET /api/lists - List user's private lists
export async function GET() {
  try {
    const user = await requireAuth();
    const lists = await getPrivateLists(user.dbUser.id);

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create a new private list
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      );
    }

    const list = await createList({
      name: name.trim(),
      description: description?.trim() || undefined,
      ownerId: user.dbUser.id,
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}

