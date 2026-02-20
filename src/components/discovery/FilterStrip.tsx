'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchInput } from './SearchInput';
import { FilterDrawer } from './FilterDrawer';
import { ToggleChip, TagChip } from '@/components/ui';

type DatePreset = 'thisWeek' | 'weekend';

/**
 * Slim filter strip: search → 3 quick chips → Filters overflow.
 *
 * Quick chips: This Week, Weekend, Concerts (always visible).
 * Everything else lives in FilterDrawer.
 * Active non-quick filters show as dismissible TagChips below.
 */
export function FilterStrip() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [venueNames, setVenueNames] = useState<Record<string, string>>({});

  // ─── Quick chip state ───
  const currentWhen = searchParams.get('when') as DatePreset | null;
  const categoriesParam = searchParams.get('categories');
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : [];
  const isConcertActive = selectedCategories.includes('CONCERT');
  const isFriendsActive = searchParams.get('friendsGoing') === 'true';

  // ─── Overflow filter state (for badge count + active tags) ───
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const hasCustomDates = !!(startDate || endDate) && !currentWhen;
  const selectedVenueIds = searchParams.get('venueIds')?.split(',').filter(Boolean) || [];
  const isNewActive = searchParams.get('new') === 'true';
  const isPresalesActive = searchParams.get('presales') === 'true';

  // Non-quick categories (everything except CONCERT)
  const overflowCategories = selectedCategories.filter((c) => c !== 'CONCERT');

  // Count of active filters NOT represented by quick chips
  let overflowCount = 0;
  if (hasCustomDates) overflowCount += 1;
  overflowCount += overflowCategories.length;
  overflowCount += selectedVenueIds.length;
  if (isNewActive) overflowCount += 1;
  if (isPresalesActive) overflowCount += 1;

  const hasActiveTags = overflowCount > 0 || hasCustomDates;

  // Fetch venue names when venues are selected (for tag display)
  useEffect(() => {
    if (selectedVenueIds.length === 0) return;
    // Only fetch if we're missing names for some IDs
    const missing = selectedVenueIds.some((id) => !venueNames[id]);
    if (!missing) return;
    let cancelled = false;
    fetch('/api/venues')
      .then((res) => res.json())
      .then((venues: { id: string; name: string }[]) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        venues.forEach((v) => { map[v.id] = v.name; });
        setVenueNames(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedVenueIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Param helpers ───
  function updateParams(fn: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    fn(params);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/', { scroll: false });
  }

  const toggleDatePreset = (preset: DatePreset) => {
    updateParams((p) => {
      if (currentWhen === preset) {
        p.delete('when');
      } else {
        p.set('when', preset);
        p.delete('startDate');
        p.delete('endDate');
      }
    });
  };

  const toggleConcert = () => {
    updateParams((p) => {
      const next = isConcertActive
        ? selectedCategories.filter((c) => c !== 'CONCERT')
        : [...selectedCategories, 'CONCERT'];
      if (next.length > 0) p.set('categories', next.join(','));
      else p.delete('categories');
    });
  };

  const toggleFriends = () => {
    updateParams((p) => {
      if (isFriendsActive) p.delete('friendsGoing');
      else p.set('friendsGoing', 'true');
    });
  };

  // ─── Tag dismissal helpers ───
  const removeCategory = (id: string) => {
    updateParams((p) => {
      const next = selectedCategories.filter((c) => c !== id);
      if (next.length > 0) p.set('categories', next.join(','));
      else p.delete('categories');
    });
  };

  const removeVenue = (venueId: string) => {
    updateParams((p) => {
      const next = selectedVenueIds.filter((id) => id !== venueId);
      if (next.length > 0) p.set('venueIds', next.join(','));
      else p.delete('venueIds');
    });
  };

  const removeDates = () => {
    updateParams((p) => {
      p.delete('startDate');
      p.delete('endDate');
      p.delete('when');
    });
  };

  const removeDiscovery = (filter: 'new' | 'presales') => {
    updateParams((p) => { p.delete(filter); });
  };

  const clearAll = () => {
    router.push('/', { scroll: false });
  };

  // ─── Format date tag label ───
  const dateTagLabel = () => {
    if (startDate && endDate) {
      const s = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const e = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${s} – ${e}`;
    }
    if (startDate) return `From ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (endDate) return `Until ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return '';
  };

  // Category label map
  const categoryLabels: Record<string, string> = {
    COMEDY: 'Comedy',
    THEATER: 'Theater',
    SPORTS: 'Sports',
    OTHER: 'Other',
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Row 1: Search */}
      <SearchInput />

      {/* Row 2: Quick chips + Filters button */}
      <div className="flex items-center gap-2">
        <ToggleChip active={currentWhen === 'thisWeek'} onClick={() => toggleDatePreset('thisWeek')}>
          This Week
        </ToggleChip>
        <ToggleChip active={currentWhen === 'weekend'} onClick={() => toggleDatePreset('weekend')}>
          Weekend
        </ToggleChip>
        <ToggleChip active={isConcertActive} onClick={toggleConcert}>
          Concerts
        </ToggleChip>
        <ToggleChip active={isFriendsActive} onClick={toggleFriends}>
          Friends
        </ToggleChip>

        {/* Filters overflow button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors
            ${overflowCount > 0
              ? 'bg-[var(--action-engage-light)] border-[var(--action-engage)] text-[var(--action-engage)]'
              : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-inset)]'
            }`}
        >
          <FilterIcon />
          {overflowCount > 0 ? `Filters (${overflowCount})` : 'Filters'}
        </button>
      </div>

      {/* Row 3: Active filter tags (only non-quick filters) */}
      {hasActiveTags && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Custom date range */}
          {hasCustomDates && (
            <TagChip onRemove={removeDates}>{dateTagLabel()}</TagChip>
          )}

          {/* Non-quick categories */}
          {overflowCategories.map((id) => (
            <TagChip key={id} onRemove={() => removeCategory(id)}>
              {categoryLabels[id] || id}
            </TagChip>
          ))}

          {/* Discovery */}
          {isNewActive && <TagChip onRemove={() => removeDiscovery('new')}>New</TagChip>}
          {isPresalesActive && <TagChip onRemove={() => removeDiscovery('presales')}>Presales</TagChip>}

          {/* Venue tags */}
          {selectedVenueIds.map((id) => (
            <TagChip key={id} onRemove={() => removeVenue(id)}>
              {venueNames[id] || 'Venue'}
            </TagChip>
          ))}

          {/* Clear all link */}
          {overflowCount >= 2 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

/* ─── FilterIcon ─── */
function FilterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}
