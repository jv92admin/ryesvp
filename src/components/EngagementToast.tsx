'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TOAST_SHOWN_KEY = 'ryesvp_first_engagement_toast_shown';

interface EngagementToastProps {
  // Pass current engagement counts to detect 0 → 1 transition
  goingCount: number;
  interestedCount: number;
  planCount: number;
}

export function EngagementToast({ goingCount, interestedCount, planCount }: EngagementToastProps) {
  const [visible, setVisible] = useState(false);
  const [prevCounts, setPrevCounts] = useState<{ going: number; interested: number; plans: number } | null>(null);

  const totalEngagement = goingCount + interestedCount + planCount;

  useEffect(() => {
    // Initialize previous counts on first render
    if (prevCounts === null) {
      setPrevCounts({ going: goingCount, interested: interestedCount, plans: planCount });
      return;
    }

    const prevTotal = prevCounts.going + prevCounts.interested + prevCounts.plans;
    
    // Check if we went from 0 → 1+ and haven't shown toast before
    if (prevTotal === 0 && totalEngagement > 0) {
      const alreadyShown = localStorage.getItem(TOAST_SHOWN_KEY);
      if (!alreadyShown) {
        setVisible(true);
        localStorage.setItem(TOAST_SHOWN_KEY, 'true');
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => setVisible(false), 5000);
      }
    }

    // Update previous counts
    setPrevCounts({ going: goingCount, interested: interestedCount, plans: planCount });
  }, [goingCount, interestedCount, planCount, totalEngagement, prevCounts]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 max-w-sm">
        {/* Check icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">Added to Your Events</p>
          <Link 
            href="/?view=social"
            className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
            onClick={handleDismiss}
          >
            View Your Events →
          </Link>
        </div>

        {/* Dismiss button */}
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
    </div>
  );
}

/**
 * Simpler version: Show toast imperatively after an action
 * Use this when you know the user just did their first engagement
 */
export function useEngagementToast() {
  const [visible, setVisible] = useState(false);

  const showToast = useCallback(() => {
    const alreadyShown = localStorage.getItem(TOAST_SHOWN_KEY);
    if (!alreadyShown) {
      setVisible(true);
      localStorage.setItem(TOAST_SHOWN_KEY, 'true');
      setTimeout(() => setVisible(false), 5000);
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

