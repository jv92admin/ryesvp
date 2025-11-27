// POST /api/invites/[code]/redeem - Redeem invite code after signup

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { redeemInviteCode } from '@/db/invites';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await redeemInviteCode(code, user.dbUser.id);

    if (!result.success) {
      // Not an error - just means they already have a referrer or invalid code
      return NextResponse.json({
        success: false,
        reason: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      friendshipCreated: result.friendshipCreated,
      inviterName: result.inviterName,
    });
  } catch (error) {
    console.error('Error redeeming invite code:', error);
    return NextResponse.json(
      { error: 'Failed to redeem invite code' },
      { status: 500 }
    );
  }
}

