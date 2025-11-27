// POST /api/auth/complete-signup - Complete signup with invite code
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrUpdateUser, getUserByAuthId } from '@/db/users';
import { redeemInviteCode } from '@/db/invites';

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Get the current Supabase user
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already exists in our DB (shouldn't happen, but just in case)
    const existingUser = await getUserByAuthId(supabaseUser.id);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Account already exists' },
        { status: 400 }
      );
    }

    // Create the user in our database
    const dbUser = await createOrUpdateUser({
      authProviderId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.display_name || null,
    });

    // Redeem the invite code (creates friendship with inviter)
    try {
      await redeemInviteCode(inviteCode, dbUser.id);
    } catch (err) {
      // If invite redemption fails, we still created the user
      // Log the error but don't fail the whole signup
      console.error('Failed to redeem invite code:', err);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
      },
    });
  } catch (error) {
    console.error('Error completing signup:', error);
    return NextResponse.json(
      { error: 'Failed to complete signup' },
      { status: 500 }
    );
  }
}

