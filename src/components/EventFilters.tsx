'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface ListOption {
  id: string;
  name: string;
}

interface CommunityOption {
  id: string;
  name: string;
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
  lists?: ListOption[];
  communities?: CommunityOption[];
  showFriendsFilter?: boolean;
}

export function EventFilters({ venues, lists = [], communities = [], showFriendsFilter = false }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Derive initial values from searchParams
  const getInitialFriendsValue = () => {
    if (searchParams.get('myEvents') === 'true') return '__my_events__';
    if (searchParams.get('friendsGoing') === 'true') return '__all_friends__';
    return searchParams.get('listId') || '';
  };

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
  const [friendsValue, setFriendsValue] = useState(getInitialFriendsValue());
  const [communityId, setCommunityId] = useState(searchParams.get('communityId') || '');

  // Sync state with URL params when they change
  useEffect(() => {
    setSelectedVenues(getInitialVenues());
    setSelectedCategories(getInitialCategories());
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');
    setFriendsValue(getInitialFriendsValue());
    setCommunityId(searchParams.get('communityId') || '');
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
    
    // Handle friends filter
    if (friendsValue === '__my_events__') {
      params.set('myEvents', 'true');
    } else if (friendsValue === '__all_friends__') {
      params.set('friendsGoing', 'true');
    } else if (friendsValue) {
      params.set('listId', friendsValue);
    }
    
    if (communityId) params.set('communityId', communityId);
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearFilters = () => {
    setSelectedVenues([]);
    setSelectedCategories([]);
    setStartDate('');
    setEndDate('');
    setFriendsValue('');
    setCommunityId('');
    router.push('/');
  };

  const hasFilters = selectedVenues.length > 0 || selectedCategories.length > 0 || startDate || endDate || friendsValue || communityId;

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);

  // Helper to get display text for multi-select
  const getCategoryLabel = () => {
    if (selectedCategories.length === 0) return 'All';
    if (selectedCategories.length === 1) {
      return CATEGORIES.find(c => c.value === selectedCategories[0])?.label || 'All';
    }
    return `${selectedCategories.length} selected`;
  };

  const getVenueLabel = () => {
    if (selectedVenues.length === 0) return 'All';
    if (selectedVenues.length === 1) {
      return venues.find(v => v.id === selectedVenues[0])?.name || 'All';
    }
    return `${selectedVenues.length} selected`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
      <div className="flex flex-wrap gap-2 items-end">
        {/* Category Filter (multi-select dropdown) */}
        <div className="relative flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category
          </label>
          <button
            type="button"
            onClick={() => { setCategoryOpen(!categoryOpen); setVenueOpen(false); }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 hover:border-gray-400 flex items-center justify-between text-left"
          >
            <span className="truncate">{getCategoryLabel()}</span>
            <svg className={`w-3 h-3 text-gray-500 ml-1 flex-shrink-0 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {categoryOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <label key={cat.value} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    className="rounded border-gray-300 text-blue-600 mr-2 h-3.5 w-3.5"
                  />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Venue Filter (multi-select dropdown) */}
        <div className="relative flex-1 min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Venue
          </label>
          <button
            type="button"
            onClick={() => { setVenueOpen(!venueOpen); setCategoryOpen(false); }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 hover:border-gray-400 flex items-center justify-between text-left"
          >
            <span className="truncate">{getVenueLabel()}</span>
            <svg className={`w-3 h-3 text-gray-500 ml-1 flex-shrink-0 transition-transform ${venueOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {venueOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
              {venues.map((venue) => (
                <label key={venue.id} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedVenues.includes(venue.id)}
                    onChange={() => toggleVenue(venue.id)}
                    className="rounded border-gray-300 text-blue-600 mr-2 h-3.5 w-3.5"
                  />
                  <span className="text-sm text-gray-700">{venue.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-[110px]">
          <label htmlFor="startDate" className="block text-xs font-medium text-gray-600 mb-1">
            From
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        {/* End Date */}
        <div className="flex-1 min-w-[110px]">
          <label htmlFor="endDate" className="block text-xs font-medium text-gray-600 mb-1">
            To
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>

        {/* Show Events By Filter */}
        {showFriendsFilter && (
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="friends" className="block text-xs font-medium text-gray-600 mb-1">
              Show
            </label>
            <select
              id="friends"
              value={friendsValue}
              onChange={(e) => setFriendsValue(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All Events</option>
              <option value="__my_events__">My Events</option>
              <option value="__all_friends__">Friends Going</option>
              {lists.length > 0 && (
                <>
                  <option disabled>── Lists ──</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        {/* Communities Filter */}
        {showFriendsFilter && communities.length > 0 && (
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="community" className="block text-xs font-medium text-gray-600 mb-1">
              Community
            </label>
            <select
              id="community"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">All</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => { applyFilters(); setCategoryOpen(false); setVenueOpen(false); }}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={() => { clearFilters(); setCategoryOpen(false); setVenueOpen(false); }}
              className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Selected filters display */}
      {(selectedCategories.length > 0 || selectedVenues.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
          {selectedCategories.map(cat => (
            <span 
              key={cat}
              className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {CATEGORIES.find(c => c.value === cat)?.label}
              <button
                onClick={() => toggleCategory(cat)}
                className="ml-1 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
          {selectedVenues.map(venueId => (
            <span 
              key={venueId}
              className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full"
            >
              {venues.find(v => v.id === venueId)?.name}
              <button
                onClick={() => toggleVenue(venueId)}
                className="ml-1 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

