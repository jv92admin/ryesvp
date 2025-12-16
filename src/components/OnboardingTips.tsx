'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EngagementStats {
  showTip1: boolean;
  showTip2: boolean;
}

export function OnboardingTips() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [dismissedTip1, setDismissedTip1] = useState(false);
  const [dismissedTip2, setDismissedTip2] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tips are now purely contextual - they show based on DB state:
    // - Tip 1: Shows while goingCount + interestedCount === 0
    // - Tip 2: Shows while friendsExcludingInviter === 0
    // 
    // Session dismissal allows user to temporarily hide tips during this session,
    // but they'll re-appear next session if the condition is still true.
    // This is intentional - contextual reminders until user takes action.
    const dismissed1 = sessionStorage.getItem('ryesvp_dismissed_tip1');
    const dismissed2 = sessionStorage.getItem('ryesvp_dismissed_tip2');
    if (dismissed1) setDismissedTip1(true);
    if (dismissed2) setDismissedTip2(true);

    async function fetchStats() {
      try {
        const res = await fetch('/api/users/me/engagement');
        if (res.ok) {
          const data = await res.json();
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
    // Session-only dismissal - tip will re-appear next session if condition still true
    sessionStorage.setItem('ryesvp_dismissed_tip1', 'true');
  };

  const handleDismissTip2 = () => {
    setDismissedTip2(true);
    // Session-only dismissal - tip will re-appear next session if condition still true
    sessionStorage.setItem('ryesvp_dismissed_tip2', 'true');
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
    return null;
  }

  // Pure contextual logic - show tips while conditions are true
  // Session dismissal allows temporary hiding, but tip re-appears next session
  // if user hasn't taken the action yet (0 events marked, 0 friends added)
  const showTip1 = stats.showTip1 && !dismissedTip1;
  const showTip2 = stats.showTip2 && !dismissedTip2;

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
