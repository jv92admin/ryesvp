import prisma from './prisma';
import { Enrichment, EnrichmentStatus } from '@prisma/client';

/**
 * Get enrichment data for an event
 */
export async function getEventEnrichment(eventId: string): Promise<Enrichment | null> {
  return prisma.enrichment.findUnique({
    where: { eventId },
  });
}

/**
 * Get enrichment data for multiple events (batch)
 */
export async function getEventEnrichments(eventIds: string[]): Promise<Map<string, Enrichment>> {
  const enrichments = await prisma.enrichment.findMany({
    where: {
      eventId: { in: eventIds },
      status: { in: [EnrichmentStatus.COMPLETED, EnrichmentStatus.PARTIAL] },
    },
  });
  
  const map = new Map<string, Enrichment>();
  for (const e of enrichments) {
    map.set(e.eventId, e);
  }
  return map;
}

/**
 * Get enrichment stats
 */
export async function getEnrichmentStats(): Promise<{
  total: number;
  completed: number;
  partial: number;
  failed: number;
  pending: number;
  skipped: number;
}> {
  const [total, completed, partial, failed, pending, skipped] = await Promise.all([
    prisma.enrichment.count(),
    prisma.enrichment.count({ where: { status: EnrichmentStatus.COMPLETED } }),
    prisma.enrichment.count({ where: { status: EnrichmentStatus.PARTIAL } }),
    prisma.enrichment.count({ where: { status: EnrichmentStatus.FAILED } }),
    prisma.enrichment.count({ where: { status: EnrichmentStatus.PENDING } }),
    prisma.enrichment.count({ where: { status: EnrichmentStatus.SKIPPED } }),
  ]);
  
  return { total, completed, partial, failed, pending, skipped };
}

