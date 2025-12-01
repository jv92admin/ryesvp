'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TagChip } from '@/components/ui';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

// Available categories
const CATEGORIES = [
  { value: 'CONCERT', label: 'Concerts' },
  { value: 'COMEDY', label: 'Comedy' },
  { value: 'THEATER', label: 'Theater' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'FESTIVAL', label: 'Festivals' },
  { value: 'OTHER', label: 'Other' },
];

interface EventFiltersProps {
  venues: Venue[];
}

export function EventFilters({ venues }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getInitialVenues = () => {
    const param = searchParams.get('venueIds');
    return param ? param.split(',') : [];
  };

  const getInitialCategories = () => {
    const param = searchParams.get('categories');
    return param ? param.split(',') : [];
  };

  const [selectedVenues, setSelectedVenues] = useState<string[]>(getInitialVenues());
  const [selectedCategories, setSelectedCategories] = useState<string[]>(getInitialCategories());
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  // Sync state with URL params when they change
  useEffect(() => {
    setSelectedVenues(getInitialVenues());
    setSelectedCategories(getInitialCategories());
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const toggleVenue = (venueId: string) => {
    setSelectedVenues(prev => 
      prev.includes(venueId) 
        ? prev.filter(v => v !== venueId)
        : [...prev, venueId]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedVenues.length > 0) params.set('venueIds', selectedVenues.join(','));
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearFilters = () => {
    setSelectedVenues([]);
    setSelectedCategories([]);
    setStartDate('');
    setEndDate('');
    router.push('/');
  };

  const hasFilters = selectedVenues.length > 0 || selectedCategories.length > 0 || startDate || endDate;

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);

  // Helper to get display text for multi-select
  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return 'Category';
    if (selectedCategories.length === 1) {
      return CATEGORIES.find(c => c.value === selectedCategories[0])?.label || 'Category';
    }
    return `${selectedCategories.length} categories`;
  };

  const getVenueLabel = () => {
    if (selectedVenues.length === 0) return 'Venue';
    if (selectedVenues.length === 1) {
      return venues.find(v => v.id === selectedVenues[0])?.name || 'Venue';
    }
    return `${selectedVenues.length} venues`;
  };

  // Quick date helpers
  const getThisWeekDates = () => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
    return {
      start: today.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  };

  const getNextWeekDates = () => {
    const today = new Date();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()) + 1); // Monday next week
    const nextSaturday = new Date(nextSunday);
    nextSaturday.setDate(nextSunday.getDate() + 6);
    return {
      start: nextSunday.toISOString().split('T')[0],
      end: nextSaturday.toISOString().split('T')[0],
    };
  };

  const setQuickDate = (preset: 'thisWeek' | 'nextWeek') => {
    const dates = preset === 'thisWeek' ? getThisWeekDates() : getNextWeekDates();
    setStartDate(dates.start);
    setEndDate(dates.end);
  };

  // Check if current date selection matches a preset
  const isThisWeek = () => {
    const dates = getThisWeekDates();
    return startDate === dates.start && endDate === dates.end;
  };

  const isNextWeek = () => {
    const dates = getNextWeekDates();
    return startDate === dates.start && endDate === dates.end;
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Row 1: Filter Pills - evenly distributed */}
      <div className="flex items-center gap-3">
        {/* Category Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setCategoryOpen(!categoryOpen); setVenueOpen(false); }}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-0.5 ${
              selectedCategories.length > 0
                ? 'bg-[var(--brand-primary-light)] border-green-300 text-[var(--brand-primary)]'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span>{getCategoryLabel()}</span>
            <svg className={`w-2.5 h-2.5 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoryOpen && (
            <div className="absolute z-20 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <label key={cat.value} className="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    className="rounded border-gray-300 text-[var(--brand-primary)] mr-2 h-3.5 w-3.5"
                  />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Venue Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setVenueOpen(!venueOpen); setCategoryOpen(false); }}
            className={`px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-0.5 ${
              selectedVenues.length > 0
                ? 'bg-[var(--brand-primary-light)] border-green-300 text-[var(--brand-primary)]'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span>{getVenueLabel()}</span>
            <svg className={`w-2.5 h-2.5 transition-transform ${venueOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {venueOpen && (
            <div className="absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
              {venues.map((venue) => (
                <label key={venue.id} className="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVenues.includes(venue.id)}
                    onChange={() => toggleVenue(venue.id)}
                    className="rounded border-gray-300 text-[var(--brand-primary)] mr-2 h-3.5 w-3.5"
                  />
                  <span className="text-sm text-gray-700">{venue.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <span className="text-gray-300">|</span>

        {/* Quick Date Pills */}
        <button
          type="button"
          onClick={() => setQuickDate('thisWeek')}
          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
            isThisWeek()
              ? 'bg-[var(--brand-primary-light)] border-green-300 text-[var(--brand-primary)]'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          This Week
        </button>
        <button
          type="button"
          onClick={() => setQuickDate('nextWeek')}
          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
            isNextWeek()
              ? 'bg-[var(--brand-primary-light)] border-green-300 text-[var(--brand-primary)]'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          Next Week
        </button>
      </div>

      {/* Row 2: Date Range (left) + Apply (right) */}
      <div className="flex items-center justify-between">
        {/* Date Range - Left */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-2 py-1 text-xs border border-gray-300 rounded-full hover:border-gray-400 focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] w-[90px] date-input-small ${
                startDate ? 'text-gray-700' : 'text-transparent'
              }`}
            />
            {!startDate && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                From
              </span>
            )}
          </div>
          <span className="text-gray-300 text-xs">–</span>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-2 py-1 text-xs border border-gray-300 rounded-full hover:border-gray-400 focus:ring-1 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)] w-[90px] date-input-small ${
                endDate ? 'text-gray-700' : 'text-transparent'
              }`}
            />
            {!endDate && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                To
              </span>
            )}
          </div>
        </div>

        {/* Apply / Clear - Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { clearFilters(); setCategoryOpen(false); setVenueOpen(false); }}
            disabled={!hasFilters}
            className={`text-xs transition-colors ${
              hasFilters 
                ? 'text-gray-500 hover:text-gray-700 cursor-pointer' 
                : 'text-gray-300 cursor-default'
            }`}
          >
            Clear
          </button>
          <button
            onClick={() => { applyFilters(); setCategoryOpen(false); setVenueOpen(false); }}
            className="px-4 py-1 text-xs font-medium rounded-full bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-colors min-w-[75px]"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Selected filters as removable chips */}
      {(selectedCategories.length > 0 || selectedVenues.length > 0) && (
        <>
          {selectedCategories.map(cat => (
            <TagChip key={cat} color="category" onRemove={() => toggleCategory(cat)}>
              {CATEGORIES.find(c => c.value === cat)?.label}
            </TagChip>
          ))}
          {selectedVenues.map(venueId => (
            <TagChip key={venueId} color="default" onRemove={() => toggleVenue(venueId)}>
              {venues.find(v => v.id === venueId)?.name}
            </TagChip>
          ))}
        </>
      )}
    </div>
  );
}

