// Infer event category from enrichment data

import { EventCategory } from '@prisma/client';
import { KGResult, isMusicRelated, isComedyRelated, isSportsRelated, isTheaterRelated } from './knowledgeGraph';
import { SpotifyArtist } from './spotify';

/**
 * Check if KG types indicate a movie/film
 */
function isMovieRelated(types: string[], description: string | null): boolean {
  const movieTypes = ['Movie', 'Film', 'TVSeries', 'TVEpisode'];
  if (types.some(t => movieTypes.includes(t))) return true;
  
  const desc = description?.toLowerCase() || '';
  if (desc.includes('film') || desc.includes('movie')) return true;
  
  return false;
}

/**
 * Check if KG result has high-confidence type info
 */
export function hasHighConfidenceKGType(kgResult: KGResult | null): boolean {
  if (!kgResult) return false;
  const { types } = kgResult;
  
  // High confidence types
  if (isMusicRelated(types)) return true;
  if (types.includes('Comedian')) return true;
  if (isSportsRelated(types)) return true;
  if (isTheaterRelated(types, null)) return true;
  
  const movieTypes = ['Movie', 'Film', 'TVSeries', 'TVEpisode'];
  if (types.some(t => movieTypes.includes(t))) return true;
  
  return false;
}

/**
 * Infer event category based on Knowledge Graph and Spotify data
 */
export function inferCategory(
  kgResult: KGResult | null,
  spotifyResult: SpotifyArtist | null
): EventCategory | null {
  // Check Knowledge Graph types first
  if (kgResult) {
    const { types, description } = kgResult;
    
    // Music
    if (isMusicRelated(types)) {
      return EventCategory.CONCERT;
    }
    
    // Comedy (based on type)
    if (types.includes('Comedian')) {
      return EventCategory.COMEDY;
    }
    
    // Sports
    if (isSportsRelated(types)) {
      return EventCategory.SPORTS;
    }
    
    // Theater (based on type)
    if (isTheaterRelated(types, null)) {
      return EventCategory.THEATER;
    }
    
    // Movies/Films (based on type)
    const movieTypes = ['Movie', 'Film', 'TVSeries', 'TVEpisode'];
    if (types.some(t => movieTypes.includes(t))) {
      return EventCategory.MOVIE;
    }
    
    // Description-based hints
    const desc = description?.toLowerCase() || '';
    const bio = kgResult.bio?.toLowerCase() || '';
    
    // Movie hints from description
    if (desc.includes('film') || desc.includes('movie')) {
      return EventCategory.MOVIE;
    }
    
    // Comedy hints from description
    if (desc.includes('comedian') || desc.includes('stand-up')) {
      return EventCategory.COMEDY;
    }
    
    // Music hints from description
    if (desc.includes('band') || desc.includes('musician') || desc.includes('singer') || 
        desc.includes('rapper') || desc.includes('dj') || desc.includes('producer')) {
      return EventCategory.CONCERT;
    }
    if (bio.includes('band') || bio.includes('musician') || bio.includes('recording artist') ||
        bio.includes('singer') || bio.includes('songwriter')) {
      return EventCategory.CONCERT;
    }
  }
  
  // Spotify match is evidence of music
  if (spotifyResult && spotifyResult.popularity >= 25 && spotifyResult.genres.length > 0) {
    return EventCategory.CONCERT;
  }
  
  return null; // Can't determine
}

/**
 * Check if the inferred category is different from the current category
 * and worth updating
 */
export function shouldUpdateCategory(
  currentCategory: EventCategory,
  inferredCategory: EventCategory | null,
  kgConfidence: boolean = false
): boolean {
  if (!inferredCategory) return false;
  if (currentCategory === inferredCategory) return false;
  
  // Always update if current is OTHER
  if (currentCategory === EventCategory.OTHER) {
    return true;
  }
  
  // If KG is confident (based on entity types, not just description), allow updates
  // This fixes cases where events were incorrectly categorized before
  if (kgConfidence) {
    return true;
  }
  
  // Don't override specific categories without KG confidence
  return false;
}

