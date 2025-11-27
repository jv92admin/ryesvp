import { Enrichment } from '@prisma/client';

interface EventEnrichmentProps {
  enrichment: Enrichment;
}

export function EventEnrichment({ enrichment }: EventEnrichmentProps) {
  const hasKG = enrichment.kgName || enrichment.kgDescription;
  const hasSpotify = enrichment.spotifyUrl;
  
  if (!hasKG && !hasSpotify) {
    return null;
  }

  // Use Spotify image if available (usually higher quality), fallback to KG
  const imageUrl = enrichment.spotifyImageUrl || enrichment.kgImageUrl;
  const genres = enrichment.spotifyGenres || [];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border border-gray-200">
      <div className="flex gap-5">
        {/* Image */}
        {imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={enrichment.kgName || 'Artist'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover shadow-sm"
            />
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          {enrichment.kgName && (
            <h3 className="font-semibold text-gray-900 text-lg">
              {enrichment.kgName}
            </h3>
          )}
          
          {/* Description */}
          {enrichment.kgDescription && (
            <p className="text-sm text-gray-600 mt-1">
              {enrichment.kgDescription}
            </p>
          )}
          
          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          
          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {enrichment.spotifyUrl && (
              <a
                href={enrichment.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1DB954] text-white text-sm font-medium rounded-full hover:bg-[#1ed760] transition-colors"
              >
                <SpotifyIcon />
                Listen on Spotify
              </a>
            )}
            {enrichment.kgWikiUrl && (
              <a
                href={enrichment.kgWikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300 transition-colors"
              >
                <WikiIcon />
                Wikipedia
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Bio (collapsible if long) */}
      {enrichment.kgBio && enrichment.kgBio.length > 200 && (
        <details className="mt-4 pt-4 border-t border-gray-200">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
            Read more about {enrichment.kgName || 'this artist'}
          </summary>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {enrichment.kgBio.slice(0, 500)}
            {enrichment.kgBio.length > 500 && '...'}
          </p>
        </details>
      )}
    </div>
  );
}

// Spotify icon
function SpotifyIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

// Wikipedia icon
function WikiIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801-.3-.852l-.36-.043c-.15-.01-.225-.06-.225-.149v-.44l.06-.05s3.397-.012 4.353.012l.051.045v.446c0 .119-.075.176-.225.176-.549.024-.882.086-1.09.27-.207.186-.356.47-.559.872l-2.391 4.802-.037.178L16.878 19.1c.296.58.801.691 1.094.691.293 0 .53-.099.53-.099.233-.09.372-.224.495-.39.123-.166 3.962-7.759 4.322-8.51.342-.711.498-1.159.498-1.378 0-.283-.205-.424-.603-.456l-.467-.034c-.15-.009-.225-.06-.225-.149v-.44l.06-.05s2.415.016 3.473 0l.037.045v.451c0 .105-.076.15-.227.15-.837.047-1.285.234-1.584.745-.299.51-4.153 7.988-4.549 8.771-.396.783-.846 1.462-1.354 2.037-.506.571-1.097.924-1.59 1.033-.492.105-.898.035-1.141-.18-.243-.218-.396-.543-.458-.985-.105-.779-.393-1.793-.661-2.424-.264-.63-.597-1.206-.992-1.724-.395-.519-.869-.959-1.414-1.32-.545-.359-1.12-.609-1.725-.748-.605-.14-1.194-.14-1.767.003-.573.143-1.079.418-1.52.818-.443.402-.79.919-1.047 1.548-.256.63-.385 1.363-.385 2.184 0 .819.13 1.546.384 2.174.259.628.607 1.143 1.047 1.545.44.403.948.677 1.52.82.573.143 1.162.143 1.767.003.605-.139 1.18-.389 1.725-.748.545-.361 1.019-.801 1.414-1.32.395-.518.728-1.094.992-1.724.268-.631.556-1.645.661-2.424.062-.442.215-.767.458-.985.243-.215.649-.285 1.141-.18.493.109 1.084.462 1.59 1.033.508.575.958 1.254 1.354 2.037.396.783 4.25 8.261 4.549 8.771.299.511.747.698 1.584.745.151 0 .227.045.227.15v.451l-.037.045c-1.058-.016-3.473 0-3.473 0l-.06-.05v-.44c0-.089.075-.14.225-.149l.467-.034c.398-.032.603-.173.603-.456 0-.219-.156-.667-.498-1.378-.36-.751-4.199-8.42-4.322-8.51-.123-.166-.262-.3-.495-.39 0 0-.237-.099-.53-.099-.293 0-.798.111-1.094.691z"/>
    </svg>
  );
}

