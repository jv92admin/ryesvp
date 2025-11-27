// GET /api/invites/me - Get current user's invite code (create if doesn't exist)

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateInviteCode, getInviteStats } from '@/db/invites';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get or create the user's invite code
    const inviteCode = await getOrCreateInviteCode(user.dbUser.id);
    
    // Get full stats
    const stats = await getInviteStats(user.dbUser.id);

    return NextResponse.json({
      code: inviteCode.code,
      usedCount: stats?.usedCount || 0,
      referrals: stats?.referrals || [],
      createdAt: inviteCode.createdAt,
    });
  } catch (error) {
    console.error('Error getting invite code:', error);
    return NextResponse.json(
      { error: 'Failed to get invite code' },
      { status: 500 }
    );
  }
}

