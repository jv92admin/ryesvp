'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

/**
 * @deprecated Replaced by FilterDrawer (Venues section).
 * Logic inlined into FilterDrawer.tsx as of Inc 2.
 * Safe to delete once verified no other imports exist.
 */
export function VenueFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get currently selected venue IDs from URL
  const selectedVenueIds = searchParams.get('venueIds')?.split(',').filter(Boolean) || [];

  // Fetch venues on mount
  useEffect(() => {
    async function fetchVenues() {
      try {
        const response = await fetch('/api/venues');
        const data = await response.json();
        setVenues(data);
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle venue selection
  const toggleVenue = (venueId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    let newSelection: string[];
    if (selectedVenueIds.includes(venueId)) {
      newSelection = selectedVenueIds.filter(id => id !== venueId);
    } else {
      newSelection = [...selectedVenueIds, venueId];
    }

    if (newSelection.length > 0) {
      params.set('venueIds', newSelection.join(','));
    } else {
      params.delete('venueIds');
    }

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // Clear all venue selections
  const clearVenues = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('venueIds');
    router.push(`/?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  // Filter venues by search query
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get names of selected venues for display
  const selectedVenueNames = venues
    .filter(v => selectedVenueIds.includes(v.id))
    .map(v => v.name);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - matches other filter chips */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-2.5 py-1 text-xs font-medium rounded-full border
          flex items-center gap-1 transition-colors
          ${selectedVenueIds.length > 0
            ? 'bg-[var(--brand-primary-light)] border-[var(--brand-primary)] text-[var(--brand-primary)]'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          }
        `}
      >
        {selectedVenueIds.length > 0 ? (
          <span>
            {selectedVenueIds.length} venue{selectedVenueIds.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span>Venues</span>
        )}
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown - fixed position on mobile to ensure it stays on screen */}
      {isOpen && (
        <div className="fixed sm:absolute top-auto sm:top-full left-4 right-4 sm:left-0 sm:right-auto mt-2 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md
                       text-gray-900 placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Venue List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading venues...</p>
            ) : filteredVenues.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No venues found</p>
            ) : (
              <div className="space-y-1">
                {filteredVenues.map((venue) => {
                  const isSelected = selectedVenueIds.includes(venue.id);
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => toggleVenue(venue.id)}
                      className={`
                        w-full text-left px-3 py-2 text-sm rounded-md
                        flex items-center gap-2 transition-colors
                        ${isSelected
                          ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <span className={`
                        w-4 h-4 border rounded flex-shrink-0
                        flex items-center justify-center
                        ${isSelected
                          ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]'
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{venue.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedVenueIds.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <button
                type="button"
                onClick={clearVenues}
                className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

