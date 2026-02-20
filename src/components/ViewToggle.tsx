'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ViewToggleProps {
  defaultView?: 'calendar' | 'social';
  onViewChange?: (view: 'calendar' | 'social') => void;
}

export function ViewToggle({ defaultView = 'calendar', onViewChange }: ViewToggleProps) {
  const searchParams = useSearchParams();
  const urlView = searchParams.get('view') as 'calendar' | 'social' | null;
  const initialView = urlView === 'social' ? 'social' : defaultView;
  
  const [view, setView] = useState<'calendar' | 'social'>(initialView);

  // Sync with URL param on mount/change
  useEffect(() => {
    if (urlView === 'social' || urlView === 'calendar') {
      setView(urlView);
      onViewChange?.(urlView);
    }
  }, [urlView, onViewChange]);

  const handleChange = (newView: 'calendar' | 'social') => {
    setView(newView);
    onViewChange?.(newView);
  };

  return (
    <div className="flex border-b border-[var(--border-default)] mb-4">
      <button
        onClick={() => handleChange('calendar')}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          view === 'calendar'
            ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        All Events
      </button>
      <button
        onClick={() => handleChange('social')}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          view === 'social'
            ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        Your Events
      </button>
    </div>
  );
}
