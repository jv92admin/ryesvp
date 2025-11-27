import prisma from './prisma';
import { Venue } from '@prisma/client';

export async function getVenues(): Promise<Venue[]> {
  return prisma.venue.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getVenueById(id: string): Promise<Venue | null> {
  return prisma.venue.findUnique({
    where: { id },
  });
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  return prisma.venue.findUnique({
    where: { slug },
  });
}

// Alias for consistency with task naming
export async function getAllVenues(): Promise<Venue[]> {
  return getVenues();
}

