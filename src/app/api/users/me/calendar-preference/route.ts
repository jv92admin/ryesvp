import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/db/prisma';

/**
 * PATCH /api/users/me/calendar-preference
 * Update the current user's calendar preference
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { preference } = body;
    
    // Validate preference
    const validPreferences = ['GOOGLE', 'APPLE', 'OUTLOOK'];
    if (!preference || !validPreferences.includes(preference)) {
      return NextResponse.json(
        { error: 'Invalid preference. Must be GOOGLE, APPLE, or OUTLOOK.' },
        { status: 400 }
      );
    }
    
    // Update user's calendar preference
    await prisma.user.update({
      where: { id: user.dbUser.id },
      data: { calendarPreference: preference },
    });
    
    return NextResponse.json({ success: true, preference });
  } catch (error) {
    console.error('Error updating calendar preference:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar preference' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/me/calendar-preference
 * Get the current user's calendar preference
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      preference: user.dbUser.calendarPreference || null 
    });
  } catch (error) {
    console.error('Error getting calendar preference:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar preference' },
      { status: 500 }
    );
  }
}

