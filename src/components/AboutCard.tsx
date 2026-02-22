'use client';

import { useState } from 'react';

interface AboutCardProps {
  description?: string | null;
  venue: {
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    url?: string | null;
  };
  eventUrl?: string | null;
  buyUrl?: string | null;
}

export function AboutCard({ description, venue, eventUrl, buyUrl }: AboutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description && description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded 
    ? description.slice(0, 150) + '...'
    : description;

  // Build venue link - prefer Google Maps if address exists, else venue URL
  const venueLink = venue.address && venue.city && venue.state
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.address}, ${venue.city}, ${venue.state}`)}`
    : venue.url || '#';

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-semibold text-[var(--text-primary)] text-base sm:text-lg">About</h2>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-4">
          <p className="text-[var(--text-secondary)] whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-[var(--signal-info)] hover:text-[var(--text-primary)] hover:underline"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* External links — event website, buy tickets */}
      {(eventUrl || buyUrl) && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          {eventUrl && (
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
            >
              Event website
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
          {buyUrl && (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors"
            >
              Buy tickets
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Venue link */}
      <div className="pt-4 border-t border-[var(--border-default)]">
        <a
          href={venueLink}
          target={venueLink.startsWith('http') ? '_blank' : undefined}
          rel={venueLink.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
        >
          <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div>
            <span className="font-medium">{venue.name}</span>
            {venue.address && venue.city && venue.state && (
              <span className="text-[var(--text-secondary)] ml-2">
                {venue.address}, {venue.city}, {venue.state}
              </span>
            )}
          </div>
        </a>
      </div>
    </div>
  );
}

