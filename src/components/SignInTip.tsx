'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SignInTip() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check sessionStorage for dismissal
    const wasDismissed = sessionStorage.getItem('ryesvp_signin_tip_dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('ryesvp_signin_tip_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg px-4 py-4 mb-4">
      <p className="text-sm text-[var(--text-secondary)]">
        See what your friends are up to this weekend.
      </p>
      <div className="flex items-center justify-between mt-2">
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--action-engage)] hover:text-[var(--action-engage-hover)] transition-colors"
        >
          Sign in &rarr;
        </Link>
        <button
          onClick={handleDismiss}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-1 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

