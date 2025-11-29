// Squad notification helpers using localStorage

const VIEWED_SQUADS_KEY = 'ryesvp_viewed_squads';
const RECENT_SQUADS_KEY = 'ryesvp_recent_squads';
const CLEANUP_INTERVAL_DAYS = 7;

interface ViewedSquad {
  squadId: string;
  viewedAt: number;
}

interface CachedSquadData {
  squads: { id: string; squadId?: string }[];
  cachedAt: number;
}

/**
 * Get list of viewed squad IDs (with cleanup of old entries)
 */
export function getViewedSquadIds(): string[] {
  try {
    const stored = localStorage.getItem(VIEWED_SQUADS_KEY);
    if (!stored) return [];

    const viewedSquads: ViewedSquad[] = JSON.parse(stored);
    const cutoff = Date.now() - (CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    
    // Cleanup old entries and return current squad IDs
    const recentSquads = viewedSquads.filter(squad => squad.viewedAt > cutoff);
    
    // Save cleaned list back
    localStorage.setItem(VIEWED_SQUADS_KEY, JSON.stringify(recentSquads));
    
    return recentSquads.map(squad => squad.squadId);
  } catch (error) {
    console.error('Error reading viewed squads:', error);
    return [];
  }
}

/**
 * Mark a squad as viewed
 */
export function markSquadAsViewed(squadId: string): void {
  try {
    const stored = localStorage.getItem(VIEWED_SQUADS_KEY);
    const viewedIds = JSON.parse(stored || '[]');
    
    // Convert existing entries to proper format
    const viewedSquads: ViewedSquad[] = viewedIds.map((entry: any) => ({
      squadId: typeof entry === 'string' ? entry : entry.squadId,
      viewedAt: typeof entry === 'string' ? Date.now() : entry.viewedAt
    }));
    
    // Add new squad if not already viewed
    if (!viewedSquads.some((squad: ViewedSquad) => squad.squadId === squadId)) {
      viewedSquads.push({ squadId, viewedAt: Date.now() });
    }
    
    localStorage.setItem(VIEWED_SQUADS_KEY, JSON.stringify(viewedSquads));
  } catch (error) {
    console.error('Error marking squad as viewed:', error);
  }
}

/**
 * Cache recent squads for instant badge calculation
 */
export function cacheRecentSquads(recentSquads: { id: string; isRecentSquadAddition?: boolean; userSquad?: any }[]): void {
  try {
    const recentData = {
      squads: recentSquads.filter(s => s.isRecentSquadAddition).map(s => ({ 
        id: s.id, 
        squadId: s.userSquad?.id  // Store both event ID and squad ID
      })),
      cachedAt: Date.now()
    };
    localStorage.setItem(RECENT_SQUADS_KEY, JSON.stringify(recentData));
  } catch (error) {
    console.error('Error caching recent squads:', error);
  }
}

/**
 * Get instant badge count from localStorage (no API call needed)
 */
export function getInstantBadgeCount(): number {
  try {
    const recentData = localStorage.getItem(RECENT_SQUADS_KEY);
    if (!recentData) return 0;
    
    const { squads: recentSquads, cachedAt }: CachedSquadData = JSON.parse(recentData);
    
    // Expire cached data after 1 hour
    if (Date.now() - cachedAt > 60 * 60 * 1000) return 0;
    
    const viewedIds = getViewedSquadIds();
    return recentSquads.filter(squad => 
      !viewedIds.includes(squad.id) && !viewedIds.includes(squad.squadId || '')
    ).length;
  } catch (error) {
    console.error('Error getting instant badge count:', error);
    return 0;
  }
}

/**
 * Count unviewed recent squads (with cleanup of non-existent squads)
 */
export function countUnviewedRecentSquads(recentSquads: { id: string; isRecentSquadAddition?: boolean; userSquad?: any }[]): number {
  const viewedIds = getViewedSquadIds();
  
  // Create sets for both event IDs and squad IDs for proper cleanup
  const currentEventIds = new Set(recentSquads.map(s => s.id));
  const currentSquadIds = new Set(recentSquads.map(s => s.userSquad?.id).filter(Boolean));
  
  // Clean up viewed squad IDs that no longer exist (check both event and squad IDs)
  const validViewedIds = viewedIds.filter(id => 
    currentEventIds.has(id) || currentSquadIds.has(id)
  );
  
  const count = recentSquads.filter(squad => 
    squad.isRecentSquadAddition && 
    !validViewedIds.includes(squad.id) && 
    !validViewedIds.includes(squad.userSquad?.id)
  ).length;
  
  // Cache recent squads for instant badge calculation
  cacheRecentSquads(recentSquads);
  
  return count;
}
