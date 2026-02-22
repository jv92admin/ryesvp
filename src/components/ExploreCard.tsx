import { Enrichment } from '@prisma/client';
import { externalBrands } from '@/lib/constants';

// Type for TM external links stored as JSON
type TMExternalLinks = {
  spotify?: string;
  youtube?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  homepage?: string;
  wiki?: string;
};

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
  
  // Parse TM external links
  const tmLinks = enrichment.tmExternalLinks as TMExternalLinks | null;
  const hasExternalLinks = tmLinks && (
    tmLinks.youtube || tmLinks.instagram || tmLinks.facebook || 
    tmLinks.twitter || tmLinks.homepage
  );
  
  if (!hasKG && !hasSpotify && !hasExternalLinks) {
    return null;
  }

  // Use Spotify image if available (usually higher quality), fallback to KG
  const imageUrl = enrichment.spotifyImageUrl || enrichment.kgImageUrl;
  const genres = enrichment.spotifyGenres || [];

  // If we have image + Spotify, use the picture + listen layout
  if (hasImage && hasSpotify) {
    return (
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--lark-text-muted)] mb-4">Explore</h2>
        <div className="flex gap-4">
          {/* Image */}
          {imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={enrichment.kgName || 'Artist'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            {enrichment.kgName && (
              <h3 className="font-semibold text-[var(--lark-text-primary)] text-base sm:text-lg">
                {enrichment.kgName}
              </h3>
            )}

            {/* Description */}
            {enrichment.kgDescription && (
              <p className="text-sm text-[var(--lark-text-secondary)] mt-1 line-clamp-2">
                {enrichment.kgDescription}
              </p>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] text-xs font-medium rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Links Row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Spotify Link */}
              {enrichment.spotifyUrl && (
                <a
                  href={enrichment.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-full hover:opacity-90 transition-colors"
                  style={{ backgroundColor: externalBrands.spotify.bg }}
                >
                  <SpotifyIcon />
                  Spotify
                </a>
              )}

              {/* External Links from TM */}
              {tmLinks?.youtube && (
                <a
                  href={tmLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-full hover:opacity-90 transition-colors"
                  style={{ backgroundColor: externalBrands.youtube.bg }}
                >
                  <YouTubeIcon />
                  YouTube
                </a>
              )}
              {tmLinks?.instagram && (
                <a
                  href={tmLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${externalBrands.instagram.gradient} text-white text-sm font-medium rounded-full hover:opacity-90 transition-colors`}
                >
                  <InstagramIcon />
                  Instagram
                </a>
              )}
              {tmLinks?.homepage && (
                <a
                  href={tmLinks.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] text-sm font-medium rounded-full hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <WebIcon />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Links without full artist info
  if (hasSpotify || hasExternalLinks) {
    return (
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--lark-text-muted)] mb-4">Explore</h2>
        <div className="flex flex-wrap gap-2">
          {enrichment.spotifyUrl && (
            <a
              href={enrichment.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: externalBrands.spotify.bg }}
            >
              <SpotifyIcon />
              Spotify
            </a>
          )}
          {tmLinks?.youtube && (
            <a
              href={tmLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: externalBrands.youtube.bg }}
            >
              <YouTubeIcon />
              YouTube
            </a>
          )}
          {tmLinks?.instagram && (
            <a
              href={tmLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${externalBrands.instagram.gradient} text-white font-medium rounded-lg hover:opacity-90 transition-colors`}
            >
              <InstagramIcon />
              Instagram
            </a>
          )}
          {tmLinks?.homepage && (
            <a
              href={tmLinks.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] font-medium rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <WebIcon />
              Website
            </a>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Icons
function SpotifyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function WebIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

