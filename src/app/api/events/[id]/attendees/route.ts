// GET /api/events/[id]/attendees?status=NEED_TICKETS
// Returns list of users with a specific attendance status for an event

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getEventAttendeesByStatus } from '@/db/userEvents';
import { AttendanceStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as AttendanceStatus | null;

  if (!status || !['INTERESTED', 'GOING', 'NEED_TICKETS', 'HAVE_TICKETS'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 });
  }

  try {
    const attendees = await getEventAttendeesByStatus(eventId, status);
    
    return NextResponse.json({
      attendees: attendees.map((a) => ({
        userId: a.userId,
        displayName: a.displayName || a.email.split('@')[0],
      })),
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}

