'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface EventFiltersProps {
  venues: Venue[];
  showFriendsFilter?: boolean;
}

export function EventFilters({ venues, showFriendsFilter = false }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [venueId, setVenueId] = useState(searchParams.get('venueId') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [friendsGoing, setFriendsGoing] = useState(searchParams.get('friendsGoing') === 'true');

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (venueId) params.set('venueId', venueId);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (friendsGoing) params.set('friendsGoing', 'true');
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const clearFilters = () => {
    setVenueId('');
    setStartDate('');
    setEndDate('');
    setFriendsGoing(false);
    router.push('/');
  };

  const hasFilters = venueId || startDate || endDate || friendsGoing;

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

        {/* Friends Going Toggle */}
        {showFriendsFilter && (
          <div className="flex items-center gap-2">
            <input
              id="friendsGoing"
              type="checkbox"
              checked={friendsGoing}
              onChange={(e) => setFriendsGoing(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="friendsGoing" className="text-sm font-medium text-gray-700">
              Friends going
            </label>
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

