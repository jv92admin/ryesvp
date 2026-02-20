'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { ToggleChip } from '@/components/ui';

type DatePreset = 'thisWeek' | 'weekend';
type CategoryId = 'CONCERT' | 'COMEDY' | 'THEATER' | 'SPORTS' | 'OTHER';

interface Venue {
  id: string;
  name: string;
  slug: string;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
}

const categoryOptions: { id: CategoryId; label: string }[] = [
  { id: 'CONCERT', label: 'Concerts' },
  { id: 'COMEDY', label: 'Comedy' },
  { id: 'THEATER', label: 'Theater' },
  { id: 'SPORTS', label: 'Sports' },
  { id: 'OTHER', label: 'Other' },
];

export function FilterDrawer({ open, onClose }: FilterDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Venues ───
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueSearch, setVenueSearch] = useState('');
  const [venuesLoading, setVenuesLoading] = useState(true);

  // ─── Discovery counts ───
  const [newCount, setNewCount] = useState(0);
  const [presalesCount, setPresalesCount] = useState(0);

  // ─── Local date state ───
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  // Sync local dates with URL
  useEffect(() => {
    setLocalStart(startDate);
    setLocalEnd(endDate);
  }, [startDate, endDate]);

  // Fetch venues when drawer opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchVenues() {
      try {
        const res = await fetch('/api/venues');
        if (res.ok && !cancelled) setVenues(await res.json());
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setVenuesLoading(false);
      }
    }
    setVenuesLoading(true);
    fetchVenues();
    return () => { cancelled = true; };
  }, [open]);

  // Fetch discovery counts when drawer opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchCounts() {
      try {
        const [newRes, presalesRes] = await Promise.all([
          fetch('/api/events/recent'),
          fetch('/api/events/presales'),
        ]);
        if (newRes.ok && !cancelled) {
          const data = await newRes.json();
          setNewCount(data.totalCount || 0);
        }
        if (presalesRes.ok && !cancelled) {
          const data = await presalesRes.json();
          setPresalesCount(data.events?.length || 0);
        }
      } catch {
        // silently fail
      }
    }
    fetchCounts();
    return () => { cancelled = true; };
  }, [open]);

  // ─── Current param state ───
  const currentWhen = searchParams.get('when') as DatePreset | null;
  const categoriesParam = searchParams.get('categories');
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : [];
  const selectedVenueIds = searchParams.get('venueIds')?.split(',').filter(Boolean) || [];
  const isNewActive = searchParams.get('new') === 'true';
  const isPresalesActive = searchParams.get('presales') === 'true';

  const today = new Date().toISOString().split('T')[0];
  const hasCustomDates = !!(startDate || endDate);

  const hasAnyFilter =
    currentWhen || hasCustomDates || selectedCategories.length > 0 ||
    selectedVenueIds.length > 0 || isNewActive || isPresalesActive;

  // ─── Param updaters ───
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

  const handleDateChange = (start: string, end: string) => {
    updateParams((p) => {
      p.delete('when');
      const effectiveStart = start || (end ? today : '');
      if (effectiveStart) p.set('startDate', effectiveStart);
      else p.delete('startDate');
      if (end) p.set('endDate', end);
      else p.delete('endDate');
    });
  };

  const toggleCategory = (id: CategoryId) => {
    updateParams((p) => {
      const next = selectedCategories.includes(id)
        ? selectedCategories.filter((c) => c !== id)
        : [...selectedCategories, id];
      if (next.length > 0) p.set('categories', next.join(','));
      else p.delete('categories');
    });
  };

  const toggleVenue = (venueId: string) => {
    updateParams((p) => {
      const next = selectedVenueIds.includes(venueId)
        ? selectedVenueIds.filter((id) => id !== venueId)
        : [...selectedVenueIds, venueId];
      if (next.length > 0) p.set('venueIds', next.join(','));
      else p.delete('venueIds');
    });
  };

  const toggleDiscovery = (filter: 'new' | 'presales') => {
    updateParams((p) => {
      const active = filter === 'new' ? isNewActive : isPresalesActive;
      if (active) p.delete(filter);
      else p.set(filter, 'true');
    });
  };

  const clearAll = () => {
    router.push('/', { scroll: false });
    onClose();
  };

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(venueSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()} size="sheet">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Filters</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <div className="space-y-6">
          {/* ─── When ─── */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">When</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <ToggleChip active={currentWhen === 'thisWeek'} onClick={() => toggleDatePreset('thisWeek')}>
                This Week
              </ToggleChip>
              <ToggleChip active={currentWhen === 'weekend'} onClick={() => toggleDatePreset('weekend')}>
                This Weekend
              </ToggleChip>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs text-[var(--text-muted)] mb-1">From</label>
                <input
                  type="date"
                  value={localStart}
                  min={today}
                  onChange={(e) => {
                    setLocalStart(e.target.value);
                    handleDateChange(e.target.value, localEnd);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border-default)] rounded-md
                           text-[var(--text-primary)] bg-[var(--surface-card)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent"
                />
              </div>
              <span className="text-[var(--text-muted)] mt-5">&rarr;</span>
              <div className="flex-1">
                <label className="block text-xs text-[var(--text-muted)] mb-1">To</label>
                <input
                  type="date"
                  value={localEnd}
                  min={localStart || today}
                  onChange={(e) => {
                    setLocalEnd(e.target.value);
                    handleDateChange(localStart, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border-default)] rounded-md
                           text-[var(--text-primary)] bg-[var(--surface-card)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* ─── Category ─── */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Category</h4>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <ToggleChip
                  key={cat.id}
                  active={selectedCategories.includes(cat.id)}
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.label}
                </ToggleChip>
              ))}
            </div>
          </section>

          {/* ─── Discovery ─── */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Discovery</h4>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                active={isNewActive}
                onClick={() => toggleDiscovery('new')}
                disabled={newCount === 0}
              >
                {newCount > 0 ? `New (${newCount})` : 'New'}
              </ToggleChip>
              <ToggleChip
                active={isPresalesActive}
                onClick={() => toggleDiscovery('presales')}
                disabled={presalesCount === 0}
              >
                {presalesCount > 0 ? `Presales (${presalesCount})` : 'Presales'}
              </ToggleChip>
            </div>
          </section>

          {/* ─── Venues ─── */}
          <section>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Venues</h4>
            <input
              type="text"
              placeholder="Search venues..."
              value={venueSearch}
              onChange={(e) => setVenueSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-md mb-2
                       text-[var(--text-primary)] bg-[var(--surface-card)] placeholder:text-[var(--text-muted)]
                       focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {venuesLoading ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">Loading venues...</p>
              ) : filteredVenues.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No venues found</p>
              ) : (
                filteredVenues.map((venue) => {
                  const isSelected = selectedVenueIds.includes(venue.id);
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => toggleVenue(venue.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors
                        ${isSelected
                          ? 'bg-[var(--action-primary)]/10 text-[var(--text-primary)]'
                          : 'hover:bg-[var(--surface-inset)] text-[var(--text-secondary)]'
                        }`}
                    >
                      <span
                        className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center
                          ${isSelected
                            ? 'bg-[var(--action-primary)] border-[var(--action-primary)]'
                            : 'border-[var(--border-default)]'
                          }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate">{venue.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </DialogBody>

      <DialogFooter className="justify-between">
        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear All
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-[var(--action-primary)] rounded-lg hover:bg-[var(--action-primary-hover)] transition-colors"
        >
          Done
        </button>
      </DialogFooter>
    </Dialog>
  );
}
