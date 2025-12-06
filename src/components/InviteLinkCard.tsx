'use client';

import { useState, useEffect } from 'react';

export function InviteLinkCard() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInviteCode() {
      try {
        const response = await fetch('/api/invites/me');
        if (response.ok) {
          const data = await response.json();
          setInviteCode(data.code);
          setUsedCount(data.usedCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch invite code:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInviteCode();
  }, []);

  const inviteLink = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${inviteCode}`
    : '';

  const handleShare = async () => {
    if (!inviteLink) return;

    const shareText = `Hey! Join me on RyesVP to discover and track Austin events together!

${inviteLink}

Sign up with my link and we'll be automatically connected 🎵`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on RyesVP',
          text: shareText,
        });
        return;
      } catch (e) {
        // User cancelled or not supported, fall back to clipboard
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-5 bg-green-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-green-100 rounded w-48"></div>
      </div>
    );
  }

  if (!inviteCode) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔗</span>
            <h3 className="font-semibold text-gray-900">Your Invite Link</h3>
            {usedCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded-full">
                {usedCount} friend{usedCount !== 1 ? 's' : ''} joined
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Share this link to invite friends. They&apos;ll be automatically connected with you!
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2">
            <code className="flex-1 text-sm text-gray-700 truncate">
              {inviteLink}
            </code>
            <button
              onClick={handleShare}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
              }`}
            >
              {copied ? '✓ Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

