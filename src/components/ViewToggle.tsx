'use client';

import { useState } from 'react';

interface ViewToggleProps {
  defaultView?: 'calendar' | 'social';
  onViewChange?: (view: 'calendar' | 'social') => void;
  socialBadgeCount?: number;
}

export function ViewToggle({ defaultView = 'calendar', onViewChange, socialBadgeCount = 0 }: ViewToggleProps) {
  const [view, setView] = useState<'calendar' | 'social'>(defaultView);

  const handleChange = (newView: 'calendar' | 'social') => {
    setView(newView);
    onViewChange?.(newView);
    
    // Clear social badge when user visits Social tab (common UX pattern)
    if (newView === 'social' && socialBadgeCount > 0) {
      // Badge will be recalculated by SocialTab based on what's actually unviewed
    }
  };

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        onClick={() => handleChange('calendar')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          view === 'calendar'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📅 Calendar
      </button>
      <button
        onClick={() => handleChange('social')}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
          view === 'social'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        👥 Social
        {socialBadgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {socialBadgeCount > 9 ? '9+' : socialBadgeCount}
          </span>
        )}
      </button>
    </div>
  );
}
