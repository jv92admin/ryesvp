import { NextResponse } from 'next/server';
import { getVenues } from '@/db/venues';

export async function GET() {
  try {
    const venues = await getVenues();
    return NextResponse.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

