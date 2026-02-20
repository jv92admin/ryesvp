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
      min-w-[5.5rem] px-2.5 py-1 text-xs font-semibold rounded-md
      text-[var(--action-engage)] bg-white
      border-2 border-amber-700/30
      hover:bg-[var(--action-engage-light)] hover:border-[var(--action-engage)]
      transition-colors
    `,
    profile: `
      px-4 py-2 text-sm font-medium rounded-lg
      text-[var(--action-engage)] bg-white
      border-2 border-amber-700/30
      hover:bg-[var(--action-engage-light)] hover:border-[var(--action-engage)]
      transition-colors flex items-center gap-2
    `,
    fab: `
      fixed bottom-6 right-6 z-40
      px-4 py-3 rounded-full shadow-lg
      bg-[var(--action-engage)] text-[var(--action-engage-text)]
      hover:bg-[var(--action-engage-hover)]
      transition-colors hover:shadow-xl
      flex items-center gap-2 font-medium
    `,
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseStyles[variant]} ${className}`}
      >
        {variant === 'fab' && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
        Start a Plan
      </button>

      <StartPlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        preSelectedFriendId={preSelectedFriendId}
      />
    </>
  );
}

