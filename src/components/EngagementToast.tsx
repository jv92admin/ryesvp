'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';

/**
 * Hook for showing first engagement toast (DB-backed, not localStorage)
 * 
 * Usage: Call showToast() after a successful attendance action.
 * The hook will check if this is the user's first engagement and show the toast.
 * The API will mark firstEngagementAt in the DB to prevent future toasts.
 */
export function useEngagementToast() {
  const [visible, setVisible] = useState(false);
  const hasShownThisSession = useRef(false);

  const showToast = useCallback(async () => {
    // Only show once per session (prevents multiple toasts if user rapidly clicks)
    if (hasShownThisSession.current) return;
    
    // Check if this is first engagement by calling the API
    // The API will only set firstEngagementAt if it's null, and returns success
    try {
      const res = await fetch('/api/users/me/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_first_engagement' }),
      });
      
      if (res.ok) {
        // Mark as shown this session and display toast
        hasShownThisSession.current = true;
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }
    } catch (err) {
      console.error('Failed to mark first engagement:', err);
    }
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const ToastComponent = visible ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 max-w-sm">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">Added to Your Events</p>
          <Link 
            href="/?view=social"
            className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
            onClick={hideToast}
          >
            View Your Events →
          </Link>
        </div>
        <button
          onClick={hideToast}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  ) : null;

  return { showToast, hideToast, ToastComponent };
}

