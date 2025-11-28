import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/db/prisma';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

// DELETE /api/users/me - Delete current user account
export async function DELETE() {
  try {
    const user = await requireAuth();
    const userId = user.dbUser.id;
    const authProviderId = user.supabaseUser.id;

    // 1. Clear invitedById references (prevents FK constraint error)
    await prisma.listMember.updateMany({
      where: { invitedById: userId },
      data: { invitedById: null },
    });

    // 2. Delete user from our database (cascades handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    // 3. Delete user from Supabase Auth (requires service role key)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      
      const { error: authError } = await adminClient.auth.admin.deleteUser(authProviderId);
      if (authError) {
        // Log but don't fail - DB user is already deleted
        console.error('Failed to delete Supabase auth user:', authError);
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set - Supabase auth user not deleted');
    }

    // 4. Sign out the current session
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

