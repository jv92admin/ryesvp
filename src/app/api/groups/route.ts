import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createGroupLink, getUserGroupLinks } from '@/db/communities';

// GET /api/groups - Get user's group links (created and joined)
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;

    const groups = await getUserGroupLinks(userId);

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group link
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Generate default name if not provided
    const displayName = user.dbUser.displayName || user.dbUser.email.split('@')[0];
    const name = body.name?.trim() || `${displayName}'s Group`;

    const group = await createGroupLink({
      name,
      ownerId: user.dbUser.id,
    });

    // Build the invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ryesvp.com';
    const inviteUrl = `${baseUrl}/g/${group.inviteCode}`;

    return NextResponse.json({ 
      group,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

