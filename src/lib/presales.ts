/**
 * Presale Detection Utilities
 * 
 * Logic for determining presale/on-sale status from Ticketmaster enrichment data.
 */

import { Enrichment } from '@prisma/client';

// Type for presale data from TM (stored as JSON)
export interface TMPresale {
  name?: string;
  description?: string;
  url?: string;
  startDateTime?: string;
  endDateTime?: string;
}

/**
 * Filter to only include "real" presales - time-limited early access.
 * Excludes resale, already-public sales, and VIP packages.
 * 
 * Used by: EventCard, /api/events/presales
 */
export function isRelevantPresale(presaleName: string | undefined): boolean {
  if (!presaleName) return false;

  const name = presaleName.toLowerCase();

  // Exclude these exact categories (not useful for presale alerts)
  // Note: Check these BEFORE presale patterns since "presale" contains "resale"
  if (name === 'resale') return false;                    // Resale market only
  if (name.includes('vip package')) return false;         // VIP upsells
  if (name.includes('official platinum')) return false;   // Dynamic pricing
  if (name.includes('standard admission')) return false;  // Already public
  if (name.includes('general admission')) return false;   // Already public

  // Include these patterns (real presales worth alerting about)
  const presalePatterns = [
    // Generic presale terms
    'presale',
    'pre-sale',
    'early access',
    'fan club',
    'member',
    'artist presale',
    'venue presale',
    'local presale',
    // Credit card / payment partner presales
    'citi',
    'amex',
    'chase',
    'capital one',
    'mastercard',
    'visa',
    'verizon',
    // Platform presales
    'spotify',
    'live nation',
    // Preferred access (card member perks)
    'preferred tickets',
    'preferred seating',
    'select seats',
  ];

  return presalePatterns.some(pattern => name.includes(pattern));
}

export type PresaleStatus = 
  | { type: 'active_presale'; presale: TMPresale; endsAt: Date }
  | { type: 'upcoming_presale'; presale: TMPresale; startsAt: Date }
  | { type: 'future_onsale'; startsAt: Date }
  | { type: 'onsale' }
  | { type: 'unknown' };

/**
 * Parse presales JSON from enrichment
 */
function parsePresales(presalesJson: unknown): TMPresale[] {
  if (!presalesJson) return [];
  if (Array.isArray(presalesJson)) return presalesJson as TMPresale[];
  return [];
}

/**
 * Check if a presale is currently active
 */
export function isActivePresale(presale: TMPresale, now: Date = new Date()): boolean {
  if (!presale.startDateTime) return false;
  
  const start = new Date(presale.startDateTime);
  const end = presale.endDateTime ? new Date(presale.endDateTime) : null;
  
  // Started and either no end date or hasn't ended yet
  return start <= now && (!end || end > now);
}

/**
 * Check if a presale is upcoming (not started yet)
 */
export function isUpcomingPresale(presale: TMPresale, now: Date = new Date()): boolean {
  if (!presale.startDateTime) return false;
  
  const start = new Date(presale.startDateTime);
  return start > now;
}

/**
 * Get the overall presale status for an event's enrichment data
 */
export function getPresaleStatus(enrichment: Enrichment | null, now: Date = new Date()): PresaleStatus {
  if (!enrichment) return { type: 'unknown' };
  
  const presales = parsePresales(enrichment.tmPresales);
  
  // Check for active presales first (highest priority)
  for (const presale of presales) {
    if (isActivePresale(presale, now)) {
      return {
        type: 'active_presale',
        presale,
        endsAt: new Date(presale.endDateTime!),
      };
    }
  }
  
  // Check for upcoming presales
  const upcomingPresales = presales
    .filter(p => isUpcomingPresale(p, now))
    .sort((a, b) => {
      const dateA = new Date(a.startDateTime!);
      const dateB = new Date(b.startDateTime!);
      return dateA.getTime() - dateB.getTime();
    });
  
  if (upcomingPresales.length > 0) {
    const nextPresale = upcomingPresales[0];
    return {
      type: 'upcoming_presale',
      presale: nextPresale,
      startsAt: new Date(nextPresale.startDateTime!),
    };
  }
  
  // Check for future public on-sale date
  if (enrichment.tmOnSaleStart && enrichment.tmOnSaleStart > now) {
    return {
      type: 'future_onsale',
      startsAt: enrichment.tmOnSaleStart,
    };
  }
  
  // If tmStatus is 'onsale', it's publicly available
  if (enrichment.tmStatus === 'onsale') {
    return { type: 'onsale' };
  }
  
  return { type: 'unknown' };
}

/**
 * Check if an event should appear in the "Presales" filter
 * 
 * Includes events with:
 * - Active presale (happening now)
 * - Upcoming presale (scheduled for future)
 * - Future on-sale date (public sale hasn't started)
 */
export function isPresaleEvent(enrichment: Enrichment | null, now: Date = new Date()): boolean {
  const status = getPresaleStatus(enrichment, now);
  return (
    status.type === 'active_presale' ||
    status.type === 'upcoming_presale' ||
    status.type === 'future_onsale'
  );
}

/**
 * Get a display-friendly label for presale status
 */
export function getPresaleBadgeInfo(status: PresaleStatus): {
  label: string;
  variant: 'active' | 'upcoming' | 'onsale' | null;
} | null {
  switch (status.type) {
    case 'active_presale':
      return {
        label: `🔐 ${status.presale.name || 'PRESALE'} NOW`,
        variant: 'active',
      };
    case 'upcoming_presale': {
      const dateStr = status.startsAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return {
        label: `⚡ ${status.presale.name || 'PRESALE'} ${dateStr}`,
        variant: 'upcoming',
      };
    }
    case 'future_onsale': {
      const dateStr = status.startsAt.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return {
        label: `🎫 ON SALE ${dateStr}`,
        variant: 'onsale',
      };
    }
    default:
      return null;
  }
}

/**
 * Get all presales (active and upcoming) for display
 */
export function getAllPresales(enrichment: Enrichment | null, now: Date = new Date()): {
  active: Array<TMPresale & { endsAt: Date }>;
  upcoming: Array<TMPresale & { startsAt: Date }>;
} {
  if (!enrichment) return { active: [], upcoming: [] };
  
  const presales = parsePresales(enrichment.tmPresales);
  
  const active: Array<TMPresale & { endsAt: Date }> = [];
  const upcoming: Array<TMPresale & { startsAt: Date }> = [];
  
  for (const presale of presales) {
    if (isActivePresale(presale, now) && presale.endDateTime) {
      active.push({ ...presale, endsAt: new Date(presale.endDateTime) });
    } else if (isUpcomingPresale(presale, now) && presale.startDateTime) {
      upcoming.push({ ...presale, startsAt: new Date(presale.startDateTime) });
    }
  }
  
  // Sort upcoming by start date
  upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  
  return { active, upcoming };
}

