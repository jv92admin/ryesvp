'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  venueName: string;
  dateFormatted: string;
  eventUrl: string;
}

export function ShareButton({ title, venueName, dateFormatted, eventUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Hey! Check out this event:

🎵 ${title}
📍 ${venueName}
📅 ${dateFormatted}

${eventUrl}`;

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: eventUrl,
        });
        return;
      } catch (e) {
        // User cancelled or not supported, fall back to clipboard
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-700 font-medium"
    >
      {copied ? (
        <>
          <span className="text-emerald-600">✓</span>
          Copied!
        </>
      ) : (
        <>
          <span>📤</span>
          Share
        </>
      )}
    </button>
  );
}

