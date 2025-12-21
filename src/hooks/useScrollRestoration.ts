'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SCROLL_STORAGE_KEY = 'ryesvp_scroll_positions';
const PAGINATION_STORAGE_KEY = 'ryesvp_pagination_state';

/**
 * Saves and restores scroll position and pagination state for a given page.
 * Uses sessionStorage so it persists across navigation but not across tabs/sessions.
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isRestoringRef = useRef(false);
  
  // Create a unique key that includes filters
  const pageKey = `${pathname}?${searchParams.toString()}`;

  // Restore scroll position on mount - returns saved position for delayed restoration
  const getSavedScrollPosition = useCallback((): number | null => {
    try {
      const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (stored) {
        const positions = JSON.parse(stored);
        const savedPosition = positions[pageKey];
        
        if (savedPosition !== undefined) {
          // Clear this position after reading (one-time restore)
          delete positions[pageKey];
          sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
          return savedPosition;
        }
      }
    } catch (error) {
      console.error('Error getting scroll position:', error);
    }
    return null;
  }, [pageKey]);

  // Restore scroll position immediately (for simple cases)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (stored) {
        const positions = JSON.parse(stored);
        const savedPosition = positions[pageKey];
        
        if (savedPosition !== undefined) {
          isRestoringRef.current = true;
          
          // Wait for content to render, then scroll
          requestAnimationFrame(() => {
            window.scrollTo(0, savedPosition);
            
            // Clear the flag after a short delay
            setTimeout(() => {
              isRestoringRef.current = false;
            }, 100);
          });
          
          // Clear this position after restoring (one-time restore)
          delete positions[pageKey];
          sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
        }
      }
    } catch (error) {
      console.error('Error restoring scroll position:', error);
    }
  }, [pageKey]);

  // Save scroll position before navigating away
  const saveScrollPosition = useCallback(() => {
    if (isRestoringRef.current) return;
    
    try {
      const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      const positions = stored ? JSON.parse(stored) : {};
      positions[pageKey] = window.scrollY;
      sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving scroll position:', error);
    }
  }, [pageKey]);

  // Save pagination state (number of loaded items)
  const savePaginationState = useCallback((loadedCount: number) => {
    try {
      const stored = sessionStorage.getItem(PAGINATION_STORAGE_KEY);
      const states = stored ? JSON.parse(stored) : {};
      states[pageKey] = loadedCount;
      sessionStorage.setItem(PAGINATION_STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Error saving pagination state:', error);
    }
  }, [pageKey]);

  // Get saved pagination state
  const getSavedPaginationState = useCallback((): number | null => {
    try {
      const stored = sessionStorage.getItem(PAGINATION_STORAGE_KEY);
      if (stored) {
        const states = JSON.parse(stored);
        const savedCount = states[pageKey];
        
        if (savedCount !== undefined) {
          // Clear this state after reading (one-time restore)
          delete states[pageKey];
          sessionStorage.setItem(PAGINATION_STORAGE_KEY, JSON.stringify(states));
          return savedCount;
        }
      }
    } catch (error) {
      console.error('Error getting pagination state:', error);
    }
    return null;
  }, [pageKey]);

  return { 
    saveScrollPosition, 
    savePaginationState, 
    getSavedPaginationState,
    getSavedScrollPosition,
    isRestoring: isRestoringRef.current 
  };
}

