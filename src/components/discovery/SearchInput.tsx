'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * Search input that updates URL on Enter or button click.
 * 
 * Features:
 * - Submit on Enter key or search button click
 * - Clears with × button
 * - Syncs with URL on mount (for back/forward nav)
 */
export function SearchInput({ 
  placeholder = 'What kind of night are we having?',
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

  const submitSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedValue = value.trim();
    
    if (trimmedValue) {
      params.set('q', trimmedValue);
    } else {
      params.delete('q');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitSearch();
    }
  };

  const handleClear = () => {
    setValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  // Check if current value differs from URL (show search button)
  const urlQuery = searchParams.get('q') || '';
  const hasUnsearchedValue = value.trim() !== urlQuery;

  return (
    <div className={`relative ${className}`}>
      {/* Search icon / submit button */}
      <button
        type="button"
        onClick={submitSearch}
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors
          ${hasUnsearchedValue
            ? 'text-[var(--action-primary)] hover:bg-[var(--surface-inset)]'
            : 'text-[var(--text-muted)] cursor-default'
          }`}
        title={hasUnsearchedValue ? 'Search' : ''}
      >
        <svg 
          className="w-4 h-4"
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
      </button>
      
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm border border-[var(--border-default)] rounded-lg
                   bg-[var(--surface-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent
                   transition-shadow"
      />
      
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
