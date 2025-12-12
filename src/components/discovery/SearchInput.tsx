'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * Debounced search input that updates URL params.
 * 
 * Features:
 * - 300ms debounce to avoid excessive API calls
 * - Instant URL update (no Apply button needed)
 * - Clears with × button or empty input
 * - Syncs with URL on mount (for back/forward nav)
 */
export function SearchInput({ 
  placeholder = 'Lady Gaga, indie rock, Moody Center...',
  className = ''
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state for immediate UI feedback
  const [value, setValue] = useState(searchParams.get('q') || '');
  
  // Sync local state with URL (for back/forward navigation)
  useEffect(() => {
    setValue(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounced URL update
  const updateUrl = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  }, [router, searchParams]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const urlQuery = searchParams.get('q') || '';
      if (value.trim() !== urlQuery) {
        updateUrl(value);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, searchParams, updateUrl]);

  const handleClear = () => {
    setValue('');
    updateUrl('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
      
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg 
                   bg-white text-gray-900 placeholder:text-gray-400
                   focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
                   transition-shadow"
      />
      
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

