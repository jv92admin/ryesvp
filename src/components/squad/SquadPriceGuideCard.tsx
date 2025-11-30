'use client';

import { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/avatar';

interface PriceGuide {
  id: string;
  label: string | null;
  priceMin: number;
  priceMax: number | null;
  source: string | null;
  addedBy: {
    id: string;
    displayName: string | null;
    email: string;
  };
  updatedAt: string;
}

interface SquadPriceGuideCardProps {
  squadId: string;
  currentUserId: string;
}

export function SquadPriceGuideCard({ squadId, currentUserId }: SquadPriceGuideCardProps) {
  const [guides, setGuides] = useState<PriceGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [label, setLabel] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [source, setSource] = useState('');

  useEffect(() => {
    fetchGuides();
  }, [squadId]);

  async function fetchGuides() {
    try {
      const res = await fetch(`/api/squads/${squadId}/price-guide`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides);
      }
    } catch (error) {
      console.error('Failed to fetch price guides:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setLabel('');
    setPriceMin('');
    setPriceMax('');
    setSource('');
    setIsAdding(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const min = parseInt(priceMin);
    if (isNaN(min) || min < 0) return;
    
    const max = priceMax ? parseInt(priceMax) : null;
    
    try {
      if (editingId) {
        const res = await fetch(`/api/squads/${squadId}/price-guide`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guideId: editingId,
            label: label || null,
            priceMin: min,
            priceMax: max,
            source: source || null,
          }),
        });
        if (res.ok) {
          fetchGuides();
          resetForm();
        }
      } else {
        const res = await fetch(`/api/squads/${squadId}/price-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: label || null,
            priceMin: min,
            priceMax: max,
            source: source || null,
          }),
        });
        if (res.ok) {
          fetchGuides();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to save price guide:', error);
    }
  }

  async function handleDelete(guideId: string) {
    try {
      const res = await fetch(`/api/squads/${squadId}/price-guide`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId }),
      });
      if (res.ok) {
        fetchGuides();
      }
    } catch (error) {
      console.error('Failed to delete price guide:', error);
    }
  }

  function startEdit(guide: PriceGuide) {
    setEditingId(guide.id);
    setLabel(guide.label || '');
    setPriceMin(guide.priceMin.toString());
    setPriceMax(guide.priceMax?.toString() || '');
    setSource(guide.source || '');
    setIsAdding(true);
  }

  function formatPrice(guide: PriceGuide) {
    if (guide.priceMax && guide.priceMax !== guide.priceMin) {
      return `$${guide.priceMin}–$${guide.priceMax}`;
    }
    return `~$${guide.priceMin}`;
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg h-20"></div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Ticket Price Guide</h4>
        {!isAdding && guides.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            + Add
          </button>
        )}
      </div>

      {guides.length === 0 && !isAdding ? (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          <p className="mb-2">No one has shared price info yet.</p>
          <p className="text-xs text-gray-400 mb-3">
            If you've seen tickets, add a rough range to help everyone decide.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            + Add price info
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {guides.map(guide => (
            <div
              key={guide.id}
              className="bg-gray-50 rounded-lg p-3 text-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {guide.label && (
                      <span className="font-medium text-gray-900">{guide.label}:</span>
                    )}
                    <span className="text-gray-900 font-medium">{formatPrice(guide)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Added by {getDisplayName(guide.addedBy.displayName, guide.addedBy.email)} · {formatTimeAgo(guide.updatedAt)}
                    {guide.source && <span> · {guide.source}</span>}
                  </div>
                </div>
                {guide.addedBy.id === currentUserId && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(guide)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(guide.id)}
                      className="text-xs text-gray-400 hover:text-red-600 px-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700">
            {editingId ? 'Edit price info' : 'Add price info'}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. GA, Balcony"
                className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Source (optional)</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Ticketmaster"
                className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min price *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="50"
                  min="0"
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max price</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="75"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Ballpark only — just to give people a sense of typical prices.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

