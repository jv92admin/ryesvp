'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip } from '@/components/ui';

type DiscoveryFilter = 'new' | 'presales';

/**
 * @deprecated Replaced by FilterDrawer (Discovery section).
 * Logic inlined into FilterDrawer.tsx as of Inc 2.
 * Safe to delete once verified no other imports exist.
 */
export function DiscoveryChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [newCount, setNewCount] = useState<number>(0);
  const [presalesCount, setPresalesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Current active filters from URL
  const isNewActive = searchParams.get('new') === 'true';
  const isPresalesActive = searchParams.get('presales') === 'true';

  // Fetch counts on mount
  useEffect(() => {
    async function fetchCounts() {
      try {
        const [newRes, presalesRes] = await Promise.all([
          fetch('/api/events/recent'),
          fetch('/api/events/presales'),
        ]);
        
        if (newRes.ok) {
          const data = await newRes.json();
          setNewCount(data.totalCount || 0);
        }
        
        if (presalesRes.ok) {
          const data = await presalesRes.json();
          setPresalesCount(data.events?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching discovery counts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCounts();
  }, []);

  const handleChipClick = (filter: DiscoveryFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    const paramName = filter === 'new' ? 'new' : 'presales';
    const isCurrentlyActive = filter === 'new' ? isNewActive : isPresalesActive;
    
    if (isCurrentlyActive) {
      // Toggle off
      params.delete(paramName);
    } else {
      // Toggle on
      params.set(paramName, 'true');
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* New Listings Chip */}
      <Chip
        variant="toggle"
        size="sm"
        active={isNewActive}
        onClick={() => handleChipClick('new')}
        disabled={loading || newCount === 0}
      >
        {!loading && newCount > 0 ? `New (${newCount})` : 'New'}
      </Chip>
      
      {/* Presales Chip */}
      <Chip
        variant="toggle"
        size="sm"
        active={isPresalesActive}
        onClick={() => handleChipClick('presales')}
        disabled={loading || presalesCount === 0}
      >
        {!loading && presalesCount > 0 ? `Presales (${presalesCount})` : 'Presales'}
      </Chip>
    </div>
  );
}

