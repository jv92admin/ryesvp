'use client';

import { useState } from 'react';
import { StartPlanModal } from './StartPlanModal';

interface StartPlanButtonProps {
  variant?: 'header' | 'profile' | 'fab';
  preSelectedFriendId?: string;
  className?: string;
}

export function StartPlanButton({ 
  variant = 'header', 
  preSelectedFriendId,
  className = '' 
}: StartPlanButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const baseStyles = {
    header: `
      flex items-center gap-1.5
      px-2.5 py-1.5 text-sm font-semibold rounded-lg
      text-[var(--lark-text-primary)]
      hover:bg-[var(--bg-hover)]
      transition-colors
    `,
    profile: `
      px-4 py-2 text-sm font-medium rounded-lg
      text-[var(--lark-text-primary)] bg-[var(--bg-elevated)]
      border-2 border-[var(--border-visible)]
      hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]
      transition-colors flex items-center gap-2
    `,
    fab: `
      fixed bottom-6 right-6 z-40
      px-4 py-3 rounded-full
      bg-[var(--accent)] text-[var(--text-inverse)]
      hover:bg-[var(--accent-hover)]
      transition-colors
      flex items-center gap-2 font-medium
    `,
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseStyles[variant]} ${className}`}
      >
        {(variant === 'fab' || variant === 'header') && (
          <svg className={variant === 'header' ? 'w-5 h-5' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={variant === 'header' ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
        {variant === 'header' ? (
          <span className="hidden sm:inline">New Plan</span>
        ) : (
          'Start a Plan'
        )}
      </button>

      <StartPlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        preSelectedFriendId={preSelectedFriendId}
      />
    </>
  );
}

