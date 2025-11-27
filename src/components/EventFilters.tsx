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

  const [venueId, setVenueId] = useState(searchParams.get('venueId') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [friendsValue, setFriendsValue] = useState(getInitialFriendsValue());
  const [communityId, setCommunityId] = useState(searchParams.get('communityId') || '');

  // Sync state with URL params when they change
  useEffect(() => {
    setVenueId(searchParams.get('venueId') || '');
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');
    setFriendsValue(getInitialFriendsValue());
    setCommunityId(searchParams.get('communityId') || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (venueId) params.set('venueId', venueId);
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
    setVenueId('');
    setStartDate('');
    setEndDate('');
    setFriendsValue('');
    setCommunityId('');
    router.push('/');
  };

  const hasFilters = venueId || startDate || endDate || friendsValue || communityId;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Venue Filter */}
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
            Venue
          </label>
          <select
            id="venue"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">All venues</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* End Date */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Friends Filter (combines "All Friends" + Lists) */}
        {showFriendsFilter && (
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="friends" className="block text-sm font-medium text-gray-700 mb-1">
              Friends
            </label>
            <select
              id="friends"
              value={friendsValue}
              onChange={(e) => setFriendsValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Everyone</option>
              <option value="__my_events__">My Events</option>
              <option value="__all_friends__">All Friends</option>
              {lists.length > 0 && (
                <>
                  <option disabled>──────────</option>
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
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="community" className="block text-sm font-medium text-gray-700 mb-1">
              Communities
            </label>
            <select
              id="community"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-800 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

