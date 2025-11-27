// Spotify API client

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export interface SpotifyArtist {
  id: string;
  name: string;
  url: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifySearchResponse {
  artists?: {
    items: Array<{
      id: string;
      name: string;
      genres: string[];
      popularity: number;
      images: Array<{ url: string; height: number; width: number }>;
      external_urls: { spotify: string };
    }>;
  };
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Spotify access token using client credentials flow
 */
async function getAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error('Spotify token error:', response.status);
      return null;
    }

    const data: SpotifyTokenResponse = await response.json();
    
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return cachedToken;
  } catch (error) {
    console.error('Spotify token error:', error);
    return null;
  }
}

/**
 * Search for an artist on Spotify
 */
export async function searchSpotifyArtist(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<SpotifyArtist | null> {
  if (!clientId || !clientSecret) {
    console.warn('No Spotify credentials provided, skipping Spotify');
    return null;
  }

  const token = await getAccessToken(clientId, clientSecret);
  if (!token) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: '1',
    });

    const response = await fetch(`${SPOTIFY_API_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Spotify search error:', response.status);
      return null;
    }

    const data: SpotifySearchResponse = await response.json();
    
    if (!data.artists?.items || data.artists.items.length === 0) {
      return null;
    }

    const artist = data.artists.items[0];
    
    // Only return if popularity is reasonable (avoid false matches)
    if (artist.popularity < 10) {
      return null;
    }

    return {
      id: artist.id,
      name: artist.name,
      url: artist.external_urls.spotify,
      genres: artist.genres,
      popularity: artist.popularity,
      imageUrl: artist.images.length > 0 ? artist.images[0].url : null,
    };
  } catch (error) {
    console.error('Spotify search error:', error);
    return null;
  }
}

/**
 * Check if the Spotify match is confident enough
 * Compares search query to result name - must have actual name similarity
 */
export function isConfidentMatch(query: string, spotifyName: string, popularity: number): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedName = spotifyName.toLowerCase().trim();
  
  // Exact match
  if (normalizedName === normalizedQuery) {
    return popularity >= 15;
  }
  
  // Query contains artist name or vice versa
  if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
    return popularity >= 20;
  }
  
  // Check word overlap - at least one significant word must match
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
  
  const hasWordMatch = queryWords.some(qw => 
    nameWords.some(nw => nw === qw || nw.includes(qw) || qw.includes(nw))
  );
  
  if (hasWordMatch && popularity >= 30) {
    return true;
  }
  
  // No name similarity - reject even if high popularity
  // (prevents "Christmas" matching random Christmas playlists)
  return false;
}

/**
 * Check if a query is too generic to search Spotify
 */
export function isGenericQuery(query: string): boolean {
  const genericTerms = [
    'christmas', 'holiday', 'new year', 'halloween', 'easter',
    'gospel', 'brunch', 'night', 'evening', 'morning',
    'live', 'tour', 'show', 'concert', 'festival',
    'tribute', 'celebration', 'party', 'jam', 'session',
  ];
  
  const normalized = query.toLowerCase().trim();
  
  // Single word generic terms
  if (genericTerms.includes(normalized)) {
    return true;
  }
  
  // Too short (probably not an artist name)
  if (normalized.length < 4) {
    return true;
  }
  
  return false;
}

