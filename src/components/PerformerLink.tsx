'use client';

import { useState } from 'react';
import { PerformerModal } from './PerformerModal';

interface PerformerLinkProps {
  performerId: string;
  performerName: string;
}

export function PerformerLink({ performerId, performerName }: PerformerLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline font-medium transition-colors"
      >
        {performerName}
      </button>
      {isOpen && (
        <PerformerModal
          performerId={performerId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

