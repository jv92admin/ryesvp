'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Dialog, DialogBody } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/IconButton';

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
          if (data.showOnboarding) {
            setShow(true);
          }
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      }
    }

    checkOnboarding();
  }, [pathname, searchParams]);

  const handleDismiss = async () => {
    setShow(false);
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
  };

  const handleLearnMore = () => {
    handleDismiss();
    window.location.href = '/about';
  };

  return (
    <Dialog open={show} onOpenChange={() => handleDismiss()} size="md">
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <IconButton
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
            label="Close"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          />
        </div>
      </div>

      <DialogBody className="pt-6 md:pt-8 pb-6 md:pb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Discover. Connect. Plan. Go.
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Find events with friends and keep each plan in one place.
        </p>

        <ul className="space-y-4 mb-8 text-[var(--text-secondary)]">
          <li className="flex items-start gap-3">
            <span className="text-[var(--text-primary)] mt-0.5 font-bold">·</span>
            <span>
              <strong className="text-[var(--text-primary)]">Discover</strong> live music, comedy, sports, and more from 15+ venues around Austin.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--text-primary)] mt-0.5 font-bold">·</span>
            <span>
              <strong className="text-[var(--text-primary)]">Connect</strong> by adding friends and seeing events they&apos;re into.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--text-primary)] mt-0.5 font-bold">·</span>
            <span>
              <strong className="text-[var(--text-primary)]">Plan</strong> in one place so who&apos;s in, tickets, and meetup details aren&apos;t buried in endless group chats.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-[var(--text-primary)] mt-0.5 font-bold">·</span>
            <span>
              <strong className="text-[var(--text-primary)]">Go</strong> when the plan actually comes together.
            </span>
          </li>
        </ul>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExploreEvents}
            className="w-full px-6 py-3 text-base font-medium rounded-lg transition-colors bg-[var(--action-primary)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)]"
          >
            Explore Events
          </button>
          <button
            onClick={handleLearnMore}
            className="w-full px-6 py-3 text-base font-medium rounded-lg transition-colors text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Learn More
          </button>
        </div>
      </DialogBody>
    </Dialog>
  );
}
