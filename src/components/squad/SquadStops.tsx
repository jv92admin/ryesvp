'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { getDisplayName } from '@/lib/avatar';
import { Button } from '@/components/ui';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface SquadStop {
  id: string;
  label: string;
  time: string | null;
  location: string | null;
  notes: string | null;
  sortOrder: number;
  addedBy: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface SquadStopsProps {
  squadId: string;
  stops: SquadStop[];
  onRefresh: () => Promise<void>;
}

export function SquadStops({ squadId, stops, onRefresh }: SquadStopsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for adding/editing
  const [formLabel, setFormLabel] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormLabel('');
    setFormTime('');
    setFormLocation('');
    setFormNotes('');
  };

  const startEdit = (stop: SquadStop) => {
    setEditingId(stop.id);
    setFormLabel(stop.label);
    setFormTime(stop.time ? new Date(stop.time).toISOString().slice(0, 16) : '');
    setFormLocation(stop.location || '');
    setFormNotes(stop.notes || '');
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleAdd = async () => {
    if (!formLabel.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/squads/${squadId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formLabel.trim(),
          time: formTime || null,
          location: formLocation.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });
      
      if (response.ok) {
        cancelEdit();
        await onRefresh();
      }
    } catch (error) {
      console.error('Error adding stop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formLabel.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/squads/${squadId}/stops`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stopId: editingId,
          label: formLabel.trim(),
          time: formTime || null,
          location: formLocation.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });
      
      if (response.ok) {
        cancelEdit();
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating stop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stopId: string) => {
    if (!confirm('Remove this stop from the itinerary?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/squads/${squadId}/stops`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopId }),
      });
      
      if (response.ok) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting stop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newOrder = [...stops];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    
    setLoading(true);
    try {
      const response = await fetch(`/api/squads/${squadId}/stops`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          stopIds: newOrder.map(s => s.id),
        }),
      });
      
      if (response.ok) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error reordering stops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === stops.length - 1) return;
    
    const newOrder = [...stops];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    setLoading(true);
    try {
      const response = await fetch(`/api/squads/${squadId}/stops`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          stopIds: newOrder.map(s => s.id),
        }),
      });
      
      if (response.ok) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error reordering stops:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      <input
        type="text"
        value={formLabel}
        onChange={(e) => setFormLabel(e.target.value)}
        placeholder="Stop name (e.g., Pre-drinks, Concert, After-party)"
        className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          value={formTime}
          onChange={(e) => setFormTime(e.target.value)}
          className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          type="text"
          value={formLocation}
          onChange={(e) => setFormLocation(e.target.value)}
          placeholder="Location"
          className="px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      <input
        type="text"
        value={formNotes}
        onChange={(e) => setFormNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={editingId ? handleUpdate : handleAdd}
          disabled={loading || !formLabel.trim()}
          loading={loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : (editingId ? 'Update' : 'Add Stop')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={cancelEdit}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">📍 Itinerary</h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="text-xs text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-medium"
          >
            + Add stop
          </button>
        )}
      </div>

      {stops.length === 0 && !isAdding ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No stops planned yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add pre-drinks, the main event, after-party, or where to meet up!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div key={stop.id}>
              {editingId === stop.id ? (
                renderForm()
              ) : (
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 group">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--brand-primary)]" />
                    {index < stops.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{stop.label}</span>
                      {stop.time && (
                        <span className="text-xs text-gray-500">
                          {formatInTimeZone(new Date(stop.time), AUSTIN_TIMEZONE, 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {stop.location && (
                      <p className="text-xs text-gray-500 truncate">{stop.location}</p>
                    )}
                    {stop.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{stop.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Added by {getDisplayName(stop.addedBy.displayName, stop.addedBy.email)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < stops.length - 1 && (
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(stop)}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(stop.id)}
                      disabled={loading}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdding && renderForm()}
    </div>
  );
}

