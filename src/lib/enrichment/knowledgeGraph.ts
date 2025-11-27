// Google Knowledge Graph API client

const KG_API_URL = 'https://kgsearch.googleapis.com/v1/entities:search';

export interface KGResult {
  entityId: string;
  name: string;
  description: string | null;
  bio: string | null;
  imageUrl: string | null;
  wikiUrl: string | null;
  types: string[];
  score: number;
}

export interface KGResponse {
  itemListElement?: Array<{
    result: {
      '@id'?: string;
      '@type'?: string[];
      name?: string;
      description?: string;
      detailedDescription?: {
        articleBody?: string;
        url?: string;
      };
      image?: {
        contentUrl?: string;
      };
      url?: string;
    };
    resultScore?: number;
  }>;
}

/**
 * Search the Google Knowledge Graph API
 */
export async function searchKnowledgeGraph(
  query: string,
  apiKey: string
): Promise<KGResult | null> {
  if (!apiKey) {
    console.warn('No Google API key provided, skipping Knowledge Graph');
    return null;
  }

  const params = new URLSearchParams({
    query,
    key: apiKey,
    limit: '1',
    indent: 'false',
  });

  try {
    const response = await fetch(`${KG_API_URL}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Knowledge Graph API error:', response.status, errorText);
      return null;
    }

    const data: KGResponse = await response.json();
    
    if (!data.itemListElement || data.itemListElement.length === 0) {
      return null;
    }

    const item = data.itemListElement[0];
    const result = item.result;

    return {
      entityId: result['@id'] || '',
      name: result.name || query,
      description: result.description || null,
      bio: result.detailedDescription?.articleBody || null,
      imageUrl: result.image?.contentUrl || null,
      wikiUrl: result.detailedDescription?.url || result.url || null,
      types: result['@type'] || [],
      score: item.resultScore || 0,
    };
  } catch (error) {
    console.error('Knowledge Graph API error:', error);
    return null;
  }
}

/**
 * Check if KG types indicate music-related entity
 */
export function isMusicRelated(types: string[]): boolean {
  const musicTypes = [
    'MusicGroup',
    'MusicRecording',
    'MusicAlbum',
    'Musician',
    'MusicArtist',
    'Band',
  ];
  return types.some(t => musicTypes.includes(t));
}

/**
 * Check if KG types indicate comedy-related entity
 */
export function isComedyRelated(types: string[], description: string | null): boolean {
  if (types.includes('Comedian')) return true;
  if (description?.toLowerCase().includes('comedian')) return true;
  if (description?.toLowerCase().includes('stand-up')) return true;
  return false;
}

/**
 * Check if KG types indicate sports-related entity
 */
export function isSportsRelated(types: string[]): boolean {
  const sportsTypes = [
    'SportsTeam',
    'SportsEvent',
    'SportsOrganization',
    'Athlete',
  ];
  return types.some(t => sportsTypes.includes(t));
}

/**
 * Check if KG types indicate theater-related entity
 */
export function isTheaterRelated(types: string[], description: string | null): boolean {
  const theaterTypes = [
    'TheaterEvent',
    'TheaterGroup',
    'Play',
    'Musical',
  ];
  if (types.some(t => theaterTypes.includes(t))) return true;
  if (description?.toLowerCase().includes('broadway')) return true;
  if (description?.toLowerCase().includes('musical')) return true;
  return false;
}

/**
 * Check if KG types indicate movie/film
 */
export function isMovieRelated(types: string[], description: string | null): boolean {
  const movieTypes = ['Movie', 'Film', 'TVSeries', 'TVEpisode'];
  if (types.some(t => movieTypes.includes(t))) return true;
  
  const desc = description?.toLowerCase() || '';
  if (desc.includes('film') || desc.includes('movie')) return true;
  
  return false;
}

