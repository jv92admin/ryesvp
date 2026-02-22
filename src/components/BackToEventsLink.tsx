'use client';

import { useRouter } from 'next/navigation';

export function BackToEventsLink() {
  const router = useRouter();

  const handleBack = () => {
    // Use browser back if there's history, otherwise go to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] transition-colors group"
    >
      <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm font-medium">All Events</span>
    </button>
  );
}
