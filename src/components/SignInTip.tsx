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
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <p className="text-sm text-gray-700">
        <Link 
          href="/login" 
          className="font-medium text-[var(--brand-primary)] hover:underline"
        >
          Sign in or sign up
        </Link>
        {' '}to track events, see friends&apos; plans, and coordinate together.
      </p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

