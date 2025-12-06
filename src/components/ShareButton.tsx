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
          url: shareUrl, // This already includes ref code
        });
        return;
      } catch (e) {
        // User cancelled or not supported, fall back to clipboard
      }
    }

    // Fall back to clipboard - use full shareText with context
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
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
        copied 
          ? 'text-green-600' 
          : 'text-gray-600 hover:text-green-600'
      }`}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}

