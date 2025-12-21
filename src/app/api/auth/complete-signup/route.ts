// POST /api/auth/complete-signup - Complete signup with invite code or group invite
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrUpdateUser, getUserByAuthId } from '@/db/users';
import { redeemInviteCode } from '@/db/invites';
import { getGroupByInviteCode } from '@/db/communities';

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, groupInviteCode } = await request.json();

    // Either a friend invite code OR a group invite code is required
    if (!inviteCode && !groupInviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // If using group invite, validate it exists
    if (groupInviteCode && !inviteCode) {
      const group = await getGroupByInviteCode(groupInviteCode);
      if (!group) {
        return NextResponse.json(
          { error: 'Invalid group invite link' },
          { status: 400 }
        );
      }
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
    // Google OAuth uses 'full_name' or 'name', not 'display_name'
    const displayName = supabaseUser.user_metadata?.full_name 
      || supabaseUser.user_metadata?.name 
      || supabaseUser.user_metadata?.display_name 
      || null;
    
    const dbUser = await createOrUpdateUser({
      authProviderId: supabaseUser.id,
      email: supabaseUser.email,
      displayName,
    });

    // Redeem the friend invite code if provided (creates friendship with inviter)
    // Group invites don't need this - they'll join the group after account creation
    if (inviteCode) {
      try {
        await redeemInviteCode(inviteCode, dbUser.id);
      } catch (err) {
        // If invite redemption fails, we still created the user
        // Log the error but don't fail the whole signup
        console.error('Failed to redeem invite code:', err);
      }
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

