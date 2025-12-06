/**
 * GET /api/events/presales
 * 
 * Returns events with upcoming presales or on-sale dates.
 * Used by CalendarSidebar to show presale alerts.
 */

import { NextResponse } from 'next/server';
import prisma from '@/db/prisma';
import { type TMPresale } from '@/lib/presales';

interface PresaleEventResult {
  id: string;
  title: string;
  startDateTime: string;
  venue: { name: string };
  presaleType: 'active' | 'upcoming' | 'onsale';
  presaleName?: string;
  presaleDate?: string;
}

export async function GET() {
  try {
    const now = new Date();
    
    // Fetch upcoming events with their enrichment data
    // We'll filter for presales in code since Prisma JSON queries are tricky
    const events = await prisma.event.findMany({
      where: {
        startDateTime: { gte: now },
        status: 'SCHEDULED',
        enrichment: { isNot: null },
      },
      include: {
        venue: { select: { name: true } },
        enrichment: {
          select: {
            tmPresales: true,
            tmOnSaleStart: true,
            tmEventName: true,
            tmPreferTitle: true,
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
      take: 200, // Fetch more since we'll filter
    });

    const presaleEvents: PresaleEventResult[] = [];

    for (const event of events) {
      const enrichment = event.enrichment;
      if (!enrichment) continue;
      
      // Skip if no presale data
      if (!enrichment.tmPresales && !enrichment.tmOnSaleStart) continue;

      const displayTitle = enrichment.tmPreferTitle && enrichment.tmEventName
        ? enrichment.tmEventName
        : event.title;

      const presales = enrichment.tmPresales as TMPresale[] | null;

      // Check for active presales
      if (presales && Array.isArray(presales)) {
        for (const presale of presales) {
          if (!presale.startDateTime) continue;

          const start = new Date(presale.startDateTime);
          const end = presale.endDateTime ? new Date(presale.endDateTime) : null;

          // Active presale
          if (start <= now && (!end || end > now)) {
            presaleEvents.push({
              id: event.id,
              title: displayTitle,
              startDateTime: event.startDateTime.toISOString(),
              venue: { name: event.venue.name },
              presaleType: 'active',
              presaleName: presale.name?.replace(/presale$/i, '').trim() || undefined,
              presaleDate: end?.toISOString(),
            });
            break; // Only add each event once
          }
        }

        // If not added as active, check for upcoming presales
        const alreadyAdded = presaleEvents.some(pe => pe.id === event.id);
        if (!alreadyAdded) {
          const upcomingPresales = presales
            .filter(p => p.startDateTime && new Date(p.startDateTime) > now)
            .sort((a, b) => new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime());

          if (upcomingPresales.length > 0) {
            const next = upcomingPresales[0];
            presaleEvents.push({
              id: event.id,
              title: displayTitle,
              startDateTime: event.startDateTime.toISOString(),
              venue: { name: event.venue.name },
              presaleType: 'upcoming',
              presaleName: next.name?.replace(/presale$/i, '').trim() || undefined,
              presaleDate: next.startDateTime,
            });
            continue;
          }
        }
      }

      // If not added yet, check for future public on-sale
      const alreadyAdded = presaleEvents.some(pe => pe.id === event.id);
      if (!alreadyAdded && enrichment.tmOnSaleStart && enrichment.tmOnSaleStart > now) {
        presaleEvents.push({
          id: event.id,
          title: displayTitle,
          startDateTime: event.startDateTime.toISOString(),
          venue: { name: event.venue.name },
          presaleType: 'onsale',
          presaleDate: enrichment.tmOnSaleStart.toISOString(),
        });
      }
    }

    // Sort by presale/onsale date (active first, then upcoming by date)
    presaleEvents.sort((a, b) => {
      // Active presales come first
      if (a.presaleType === 'active' && b.presaleType !== 'active') return -1;
      if (b.presaleType === 'active' && a.presaleType !== 'active') return 1;
      
      // Then sort by presale date
      if (a.presaleDate && b.presaleDate) {
        return new Date(a.presaleDate).getTime() - new Date(b.presaleDate).getTime();
      }
      
      return 0;
    });

    return NextResponse.json({ events: presaleEvents });
  } catch (error) {
    console.error('Error fetching presale events:', error);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}

