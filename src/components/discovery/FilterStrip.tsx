'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from './SearchInput';
import { DateChips } from './DateChips';
import { CategoryChips } from './CategoryChips';
import { DiscoveryChips } from './DiscoveryChips';
import { VenueFilter } from './VenueFilter';

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

  // Check if any filters are active
  const hasActiveFilters = 
    searchParams.get('q') ||
    searchParams.get('when') ||
    searchParams.get('startDate') ||
    searchParams.get('endDate') ||
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
        
        {/* Separator */}
        <span className="text-gray-300 hidden sm:inline">•</span>
        
        {/* Venue Filter Dropdown */}
        <VenueFilter />
        
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
    </div>
  );
}

