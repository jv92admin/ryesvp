'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Only show on home page without deep links
    const isHomePage = pathname === '/';
    const hasDeepLink = searchParams.has('event') || searchParams.has('plan') || searchParams.has('ref');
    
    if (!isHomePage || hasDeepLink) {
      return;
    }

    // Check engagement API for onboarding status (DB-backed, not localStorage)
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/users/me/engagement');
        if (res.ok) {
          const data = await res.json();
          // Show if onboarding not completed
          if (data.showOnboarding) {
            setShow(true);
          }
        }
      } catch (err) {
        // If API fails, don't show modal (fail safe)
        console.error('Failed to check onboarding status:', err);
      }
    }
    
    checkOnboarding();
  }, [pathname, searchParams]);

  const handleDismiss = async () => {
    setShow(false);
    // Mark onboarding complete in DB (replaces localStorage)
    try {
      await fetch('/api/users/me/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_onboarding' }),
      });
    } catch (err) {
      console.error('Failed to mark onboarding complete:', err);
    }
  };

  const handleExploreEvents = () => {
    handleDismiss();
    // Stay on current page (home/events)
  };

  const handleLearnMore = () => {
    handleDismiss();
    // Navigate to about page
    window.location.href = '/about';
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Discover. Connect. Plan. Go.
        </h2>
        <p className="text-gray-600 mb-6">
          Find events with friends and keep each plan in one place.
        </p>

        {/* Bullets */}
        <ul className="space-y-4 mb-8 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-[var(--brand-primary)] mt-0.5">•</span>
            <span>
              <strong className="text-gray-900">Discover</strong> live music, comedy, sports, and more from 15+ venues around Austin.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--brand-primary)] mt-0.5">•</span>
            <span>
              <strong className="text-gray-900">Connect</strong> by adding friends and seeing events they&apos;re into.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--brand-primary)] mt-0.5">•</span>
            <span>
              <strong className="text-gray-900">Plan</strong> in one place so who&apos;s in, tickets, and meetup details aren&apos;t buried in endless group chats.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--brand-primary)] mt-0.5">•</span>
            <span>
              <strong className="text-gray-900">Go</strong> when the plan actually comes together.
            </span>
          </li>
        </ul>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExploreEvents}
            className="w-full btn-primary px-6 py-3 text-base font-medium rounded-lg transition-colors"
          >
            Explore Events
          </button>
          <button
            onClick={handleLearnMore}
            className="w-full px-6 py-3 text-base font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] border border-[var(--brand-primary)] hover:border-[var(--brand-primary-hover)] rounded-lg transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

