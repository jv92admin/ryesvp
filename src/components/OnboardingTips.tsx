'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Bump this version to force-show tips to all users once
const TIPS_VERSION = '1';

interface EngagementStats {
  showTip1: boolean;
  showTip2: boolean;
}

export function OnboardingTips() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [dismissedTip1, setDismissedTip1] = useState(false);
  const [dismissedTip2, setDismissedTip2] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has seen this version of tips
    const seenVersion = localStorage.getItem('ryesvp_tips_version');
    if (seenVersion !== TIPS_VERSION) {
      // First time seeing this version - force show regardless of conditions
      setForceShow(true);
    }

    // Check sessionStorage for dismissed tips (session only - comes back on restart)
    const dismissed1 = sessionStorage.getItem('ryesvp_dismissed_tip1');
    const dismissed2 = sessionStorage.getItem('ryesvp_dismissed_tip2');
    if (dismissed1) setDismissedTip1(true);
    if (dismissed2) setDismissedTip2(true);

    async function fetchStats() {
      try {
        const res = await fetch('/api/users/me/engagement');
        if (res.ok) {
          const data = await res.json();
          console.log('[OnboardingTips] Engagement stats:', data);
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch engagement stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleDismissTip1 = () => {
    setDismissedTip1(true);
    sessionStorage.setItem('ryesvp_dismissed_tip1', 'true');
    // Mark this version as seen
    localStorage.setItem('ryesvp_tips_version', TIPS_VERSION);
  };

  const handleDismissTip2 = () => {
    setDismissedTip2(true);
    sessionStorage.setItem('ryesvp_dismissed_tip2', 'true');
    // Mark this version as seen
    localStorage.setItem('ryesvp_tips_version', TIPS_VERSION);
  };

  const handleAddFriendsClick = async () => {
    // Fetch invite code and trigger share
    try {
      const res = await fetch('/api/invites/me');
      if (!res.ok) return;
      const data = await res.json();
      
      const addFriendLink = `${window.location.origin}/?ref=${data.code}`;
      const shareText = `Add me as a friend on RyesVP! We can discover Austin events together.\n\n${addFriendLink}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Add me on RyesVP', text: shareText });
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') return;
        }
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  if (loading || !stats) {
    console.log('[OnboardingTips] Loading or no stats yet');
    return null;
  }

  // Force show if first time seeing this version, otherwise use normal conditions
  const showTip1 = (forceShow || stats.showTip1) && !dismissedTip1;
  const showTip2 = (forceShow || stats.showTip2) && !dismissedTip2;

  console.log('[OnboardingTips] Render decision:', {
    forceShow,
    'stats.showTip1': stats.showTip1,
    'stats.showTip2': stats.showTip2,
    dismissedTip1,
    dismissedTip2,
    showTip1,
    showTip2,
  });

  if (!showTip1 && !showTip2) return null;

  return (
    <div className="space-y-2 mb-4">
      {/* Tip 1: Mark events as Interested/Going */}
      {showTip1 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700">
            Mark events as{' '}
            <span className="font-medium text-[var(--brand-primary)]">Going</span>
            {' '}or{' '}
            <span className="font-medium text-amber-600">Interested</span>
            {' '}and they&apos;ll show up in{' '}
            <Link 
              href="/?view=social" 
              className="font-medium text-[var(--brand-primary)] hover:underline"
            >
              Your Events
            </Link>.
          </p>
          <button
            onClick={handleDismissTip1}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss tip"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tip 2: Add friends */}
      {showTip2 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700">
            <button
              onClick={handleAddFriendsClick}
              className="font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:underline"
            >
              {copied ? 'Link copied!' : 'Add friends'}
            </button>
            {' '}to see who&apos;s going to events you&apos;re interested in.
          </p>
          <button
            onClick={handleDismissTip2}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss tip"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
