import prisma from './prisma';

/**
 * Get all price guides for a squad
 */
export async function getSquadPriceGuides(squadId: string) {
  return prisma.squadPriceGuide.findMany({
    where: { squadId },
    include: {
      addedBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Add a price guide entry to a squad
 */
export async function createSquadPriceGuide(data: {
  squadId: string;
  addedById: string;
  label?: string;
  priceMin: number;
  priceMax?: number;
  source?: string;
}) {
  return prisma.squadPriceGuide.create({
    data: {
      squadId: data.squadId,
      addedById: data.addedById,
      label: data.label || null,
      priceMin: data.priceMin,
      priceMax: data.priceMax || null,
      source: data.source || null,
    },
    include: {
      addedBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Update a price guide entry
 */
export async function updateSquadPriceGuide(
  guideId: string,
  data: {
    label?: string | null;
    priceMin?: number;
    priceMax?: number | null;
    source?: string | null;
  }
) {
  return prisma.squadPriceGuide.update({
    where: { id: guideId },
    data,
    include: {
      addedBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Delete a price guide entry
 */
export async function deleteSquadPriceGuide(guideId: string) {
  return prisma.squadPriceGuide.delete({
    where: { id: guideId },
  });
}

/**
 * Get a single price guide by ID (for permission checks)
 */
export async function getSquadPriceGuideById(guideId: string) {
  return prisma.squadPriceGuide.findUnique({
    where: { id: guideId },
    include: {
      squad: {
        select: {
          id: true,
          createdById: true,
        },
      },
    },
  });
}

