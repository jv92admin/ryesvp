'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from './SearchInput';
import { DateChips } from './DateChips';
import { CategoryChips } from './CategoryChips';
import { DiscoveryChips } from './DiscoveryChips';

/**
 * Main filter strip component for event discovery.
 * 
 * Combines:
 * - Search input with debounce
 * - Date chips (Today, This Week, Weekend)
 * - Category chips (Concerts, Comedy, Theater, Sports)
 * - Discovery chips (New, Presales)
 * - More button (future: opens panel with all categories + venues)
 * 
 * All filters use URL params for instant apply - no Apply button needed.
 */
export function FilterStrip() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = 
    searchParams.get('q') ||
    searchParams.get('when') ||
    searchParams.get('categories') ||
    searchParams.get('venueIds') ||
    searchParams.get('new') === 'true' ||
    searchParams.get('presales') === 'true';

  const handleClearAll = () => {
    // Clear all filter params, preserve non-filter params
    const params = new URLSearchParams();
    // Keep any non-filter params if needed in the future
    router.push('/', { scroll: false });
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Row 1: Search Input */}
      <SearchInput />
      
      {/* Row 2: Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Chips */}
        <DateChips />
        
        {/* Separator */}
        <span className="text-gray-300 hidden sm:inline">•</span>
        
        {/* Category Chips */}
        <CategoryChips />
        
        {/* Separator */}
        <span className="text-gray-300 hidden sm:inline">•</span>
        
        {/* Discovery Chips (New, Presales) */}
        <DiscoveryChips />
        
        {/* More Button - for future expansion */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="px-2.5 py-1 text-xs font-medium text-gray-600 
                     bg-white border border-gray-200 rounded-full
                     hover:bg-gray-50 hover:border-gray-300 transition-colors
                     flex items-center gap-1"
        >
          More
          <svg 
            className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Clear All - only show when filters active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* More Panel Placeholder - will be implemented in later todo */}
      {showMore && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            More filters coming soon (venues, all categories)
          </p>
        </div>
      )}
    </div>
  );
}

