'use client';

import { useState, useEffect } from 'react';

interface ShareButtonProps {
  title: string;
  venueName: string;
  dateFormatted: string;
  eventUrl: string;
  isLoggedIn?: boolean;
}

export function ShareButton({ title, venueName, dateFormatted, eventUrl, isLoggedIn }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Fetch invite code if logged in
  useEffect(() => {
    async function fetchInviteCode() {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch('/api/invites/me');
        if (response.ok) {
          const data = await response.json();
          setInviteCode(data.code);
        }
      } catch (error) {
        console.error('Failed to fetch invite code:', error);
      }
    }
    
    fetchInviteCode();
  }, [isLoggedIn]);

  // Build share URL with invite code if available
  const shareUrl = inviteCode 
    ? `${eventUrl}?ref=${inviteCode}`
    : eventUrl;

  const shareText = inviteCode
    ? `Hey! Check out this event:

🎵 ${title}
📍 ${venueName}
📅 ${dateFormatted}

${shareUrl}

👋 Join me on RyesVP!`
    : `Hey! Check out this event:

🎵 ${title}
📍 ${venueName}
📅 ${dateFormatted}

${shareUrl}`;

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
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

