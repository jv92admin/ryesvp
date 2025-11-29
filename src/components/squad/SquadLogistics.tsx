'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

const AUSTIN_TIMEZONE = 'America/Chicago';

interface Squad {
  id: string;
  meetTime: string | null;
  meetSpot: string | null;
  deadline: string | null;
  playlistUrl: string | null;
  event: {
    startDateTime: string;
  };
}

interface SquadLogisticsProps {
  squad: Squad;
  onLogisticsUpdate: (updates: {
    meetTime?: string | null;
    meetSpot?: string | null;
    deadline?: string | null;
    playlistUrl?: string | null;
  }) => void;
}

export function SquadLogistics({ squad, onLogisticsUpdate }: SquadLogisticsProps) {
  const [editing, setEditing] = useState(false);
  const [meetSpot, setMeetSpot] = useState(squad.meetSpot || '');
  const [meetTime, setMeetTime] = useState(() => {
    if (squad.meetTime) {
      return formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'HH:mm');
    }
    return '';
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Construct meet time as date on same day as event
      let meetTimeDate = null;
      if (meetTime) {
        const eventDate = new Date(squad.event.startDateTime);
        const [hours, minutes] = meetTime.split(':');
        meetTimeDate = new Date(eventDate);
        meetTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      await onLogisticsUpdate({
        meetTime: meetTimeDate ? meetTimeDate.toISOString() : null,
        meetSpot: meetSpot.trim() || null,
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Failed to save logistics:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setMeetSpot(squad.meetSpot || '');
    setMeetTime(() => {
      if (squad.meetTime) {
        return formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'HH:mm');
      }
      return '';
    });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Logistics</h4>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Meet Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meet Time
            </label>
            <input
              type="time"
              value={meetTime}
              onChange={(e) => setMeetTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. 19:30"
            />
            <p className="text-xs text-gray-500 mt-1">
              When to meet before the show
            </p>
          </div>

          {/* Meet Spot Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meet Spot
            </label>
            <input
              type="text"
              value={meetSpot}
              onChange={(e) => setMeetSpot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. Lazarus Brewing, East 6th"
            />
            <p className="text-xs text-gray-500 mt-1">
              Where to meet up
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Current Logistics Display */}
          {squad.meetTime || squad.meetSpot ? (
            <div className="space-y-1">
              {squad.meetTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">⏰ Meet:</span>
                  <span className="text-gray-900">
                    {formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a')}
                  </span>
                </div>
              )}
              {squad.meetSpot && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📍 Where:</span>
                  <span className="text-gray-900">{squad.meetSpot}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No logistics set yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
