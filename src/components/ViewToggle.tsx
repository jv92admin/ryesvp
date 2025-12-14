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
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        onClick={() => handleChange('calendar')}
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          view === 'calendar'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        All Events
      </button>
      <button
        onClick={() => handleChange('social')}
        className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          view === 'social'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Your Events
      </button>
    </div>
  );
}
