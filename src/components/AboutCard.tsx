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
}

export function AboutCard({ description, venue }: AboutCardProps) {
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
        <h2 className="font-semibold text-[var(--lark-text-primary)] text-base sm:text-lg">About</h2>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-4">
          <p className="text-[var(--lark-text-secondary)] whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] hover:underline"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Venue link */}
      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <a
          href={venueLink}
          target={venueLink.startsWith('http') ? '_blank' : undefined}
          rel={venueLink.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] hover:underline"
        >
          <svg className="w-4 h-4 text-[var(--lark-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <div>
            <span className="font-medium">{venue.name}</span>
            {venue.address && venue.city && venue.state && (
              <span className="text-[var(--lark-text-secondary)] ml-2">
                {venue.address}, {venue.city}, {venue.state}
              </span>
            )}
          </div>
        </a>
      </div>
    </div>
  );
}

