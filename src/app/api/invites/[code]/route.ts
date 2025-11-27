// GET /api/invites/[code] - Validate an invite code (public)
// POST /api/invites/[code]/redeem - Redeem invite code after signup

import { NextRequest, NextResponse } from 'next/server';
import { validateInviteCode } from '@/db/invites';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;

  try {
    const result = await validateInviteCode(code);

    if (!result) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      inviterName: result.inviterName,
    });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to validate invite code' },
      { status: 500 }
    );
  }
}

