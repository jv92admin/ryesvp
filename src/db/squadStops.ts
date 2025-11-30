import prisma from './prisma';

/**
 * Get all stops for a squad, ordered by sortOrder
 */
export async function getSquadStops(squadId: string) {
  return prisma.squadStop.findMany({
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
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get the next sort order for a new stop
 */
async function getNextSortOrder(squadId: string): Promise<number> {
  const lastStop = await prisma.squadStop.findFirst({
    where: { squadId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  return (lastStop?.sortOrder ?? -1) + 1;
}

/**
 * Create a new stop in a squad's itinerary
 */
export async function createSquadStop(data: {
  squadId: string;
  addedById: string;
  label: string;
  time?: Date;
  location?: string;
  notes?: string;
}) {
  const sortOrder = await getNextSortOrder(data.squadId);
  
  return prisma.squadStop.create({
    data: {
      squadId: data.squadId,
      addedById: data.addedById,
      label: data.label,
      time: data.time || null,
      location: data.location || null,
      notes: data.notes || null,
      sortOrder,
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
 * Update a stop
 */
export async function updateSquadStop(
  stopId: string,
  data: {
    label?: string;
    time?: Date | null;
    location?: string | null;
    notes?: string | null;
  }
) {
  return prisma.squadStop.update({
    where: { id: stopId },
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
 * Delete a stop
 */
export async function deleteSquadStop(stopId: string) {
  return prisma.squadStop.delete({
    where: { id: stopId },
  });
}

/**
 * Reorder stops in a squad
 * @param squadId - The squad ID
 * @param stopIds - Array of stop IDs in the desired order
 */
export async function reorderSquadStops(squadId: string, stopIds: string[]) {
  // Update each stop's sortOrder based on its position in the array
  const updates = stopIds.map((stopId, index) =>
    prisma.squadStop.update({
      where: { id: stopId },
      data: { sortOrder: index },
    })
  );
  
  await prisma.$transaction(updates);
  
  return getSquadStops(squadId);
}

/**
 * Get a single stop by ID (for permission checks)
 */
export async function getSquadStopById(stopId: string) {
  return prisma.squadStop.findUnique({
    where: { id: stopId },
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

