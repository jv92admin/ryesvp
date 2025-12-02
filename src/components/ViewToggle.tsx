'use client';

import { useState } from 'react';

interface ViewToggleProps {
  defaultView?: 'calendar' | 'social';
  onViewChange?: (view: 'calendar' | 'social') => void;
}

export function ViewToggle({ defaultView = 'calendar', onViewChange }: ViewToggleProps) {
  const [view, setView] = useState<'calendar' | 'social'>(defaultView);

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
