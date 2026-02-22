'use client';

import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui';

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
        <h4 className="font-medium text-[var(--lark-text-primary)]">Logistics</h4>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[var(--accent)] hover:opacity-80"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Meet Time Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--lark-text-primary)] mb-1">
              Meet Time
            </label>
            <input
              type="time"
              value={meetTime}
              onChange={(e) => setMeetTime(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-visible)] rounded-lg text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--bg-primary)]"
              placeholder="e.g. 19:30"
            />
            <p className="text-xs text-[var(--lark-text-secondary)] mt-1">
              When to meet before the show
            </p>
          </div>

          {/* Meet Spot Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--lark-text-primary)] mb-1">
              Meet Spot
            </label>
            <input
              type="text"
              value={meetSpot}
              onChange={(e) => setMeetSpot(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-visible)] rounded-lg text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[var(--bg-primary)]"
              placeholder="e.g. Lazarus Brewing, East 6th"
            />
            <p className="text-xs text-[var(--lark-text-secondary)] mt-1">
              Where to meet up
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Current Logistics Display */}
          {squad.meetTime || squad.meetSpot ? (
            <div className="space-y-1">
              {squad.meetTime && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--lark-text-secondary)]">Meet:</span>
                  <span className="text-[var(--lark-text-primary)]">
                    {formatInTimeZone(new Date(squad.meetTime), AUSTIN_TIMEZONE, 'h:mm a')}
                  </span>
                </div>
              )}
              {squad.meetSpot && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--lark-text-secondary)]">Where:</span>
                  <span className="text-[var(--lark-text-primary)]">{squad.meetSpot}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-[var(--lark-text-secondary)] italic">
              No logistics set yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
