'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SetNameBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has a display name
    const checkName = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const json = await res.json();
          if (!json.user.displayName) {
            // Check if already dismissed this session
            const wasDismissed = sessionStorage.getItem('name-banner-dismissed');
            if (!wasDismissed) {
              setShow(true);
            }
          }
        }
      } catch {
        // Ignore errors
      }
    };
    checkName();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('name-banner-dismissed', 'true');
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--card-radius)] px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <p className="text-sm text-[var(--lark-text-primary)]">
        <Link 
          href="/profile" 
          className="font-medium text-[var(--accent)] hover:underline"
        >
          Add your name
        </Link>
        {' '}so friends can recognize you.
      </p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-[var(--lark-text-muted)] hover:text-[var(--lark-text-secondary)] p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

