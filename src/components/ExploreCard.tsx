import { Enrichment } from '@prisma/client';

interface ExploreCardProps {
  enrichment: Enrichment | null;
}

export function ExploreCard({ enrichment }: ExploreCardProps) {
  if (!enrichment) {
    return null;
  }

  const hasKG = enrichment.kgName || enrichment.kgDescription;
  const hasSpotify = enrichment.spotifyUrl;
  const hasImage = enrichment.spotifyImageUrl || enrichment.kgImageUrl;
  
  if (!hasKG && !hasSpotify) {
    return null;
  }

  // Use Spotify image if available (usually higher quality), fallback to KG
  const imageUrl = enrichment.spotifyImageUrl || enrichment.kgImageUrl;
  const genres = enrichment.spotifyGenres || [];

  // If we have image + Spotify, use the picture + listen layout
  if (hasImage && hasSpotify) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 h-full flex flex-col">
        <h2 className="font-semibold text-gray-900 text-base sm:text-lg mb-4">Explore</h2>
        <div className="flex gap-4">
          {/* Image */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={enrichment.kgName || 'Artist'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-sm"
              />
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            {enrichment.kgName && (
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                {enrichment.kgName}
              </h3>
            )}
            
            {/* Description */}
            {enrichment.kgDescription && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {enrichment.kgDescription}
              </p>
            )}
            
            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            
            {/* Spotify Link */}
            {enrichment.spotifyUrl && (
              <a
                href={enrichment.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1DB954] text-white text-sm font-medium rounded-full hover:bg-[#1ed760] transition-colors mt-3"
              >
                <SpotifyIcon />
                Listen on Spotify
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Just Spotify button if no image
  if (hasSpotify) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 h-full flex flex-col">
        <h2 className="font-semibold text-gray-900 text-base sm:text-lg mb-4">Explore</h2>
        <a
          href={enrichment.spotifyUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base text-white font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#1DB954' }}
        >
          <SpotifyIcon />
          Listen on Spotify
        </a>
      </div>
    );
  }

  return null;
}

// Spotify icon
function SpotifyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

