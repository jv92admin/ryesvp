import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { upsertUserEvent, deleteUserEvent, getUserEventByEventId } from '@/db/userEvents';
import { AttendanceStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: eventId } = await params;

    const userEvent = await getUserEventByEventId(user.dbUser.id, eventId);

    return NextResponse.json({ userEvent });
  } catch (error) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: eventId } = await params;
    const body = await request.json();
    const { status, comment } = body;

    if (!status || !['GOING', 'INTERESTED', 'NOT_GOING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be GOING, INTERESTED, or NOT_GOING' },
        { status: 400 }
      );
    }

    const userEvent = await upsertUserEvent({
      userId: user.dbUser.id,
      eventId,
      status: status as AttendanceStatus,
      comment: comment || null,
    });

    return NextResponse.json({ userEvent });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: eventId } = await params;

    await deleteUserEvent(user.dbUser.id, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}

