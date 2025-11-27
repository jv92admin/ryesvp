import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/db/prisma';

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const user = await requireAuth();
    
    return NextResponse.json({ 
      user: user.dbUser,
      email: user.supabaseUser.email,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { displayName } = body;

    if (displayName !== undefined && displayName !== null) {
      const trimmed = displayName.trim();
      if (trimmed.length > 0 && trimmed.length < 2) {
        return NextResponse.json(
          { error: 'Display name must be at least 2 characters' },
          { status: 400 }
        );
      }
      if (trimmed.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be less than 50 characters' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.dbUser.id },
      data: {
        displayName: displayName?.trim() || null,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

