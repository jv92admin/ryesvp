import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchUsersByEmail } from '@/db/friends';

// GET /api/users/search?email=query - Search users by email
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email || email.length < 3) {
      return NextResponse.json(
        { error: 'Email query must be at least 3 characters' },
        { status: 400 }
      );
    }

    const users = await searchUsersByEmail(email, user.dbUser.id);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

