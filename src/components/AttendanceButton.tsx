'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';

interface AttendanceButtonProps {
  eventId: string;
  currentStatus?: AttendanceStatus | null;
  currentComment?: string | null;
  onStatusChange?: () => void;
}

export function AttendanceButton({ 
  eventId, 
  currentStatus, 
  currentComment,
  onStatusChange 
}: AttendanceButtonProps) {
  const [status, setStatus] = useState<AttendanceStatus | null>(currentStatus || null);
  const [comment, setComment] = useState(currentComment || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showComment, setShowComment] = useState(!!currentStatus);

  const handleStatusChange = async (newStatus: AttendanceStatus) => {
    setIsLoading(true);
    try {
      if (status === newStatus) {
        // Toggle off - remove status
        await fetch(`/api/events/${eventId}/attendance`, {
          method: 'DELETE',
        });
        setStatus(null);
        setShowComment(false);
        setComment('');
      } else {
        // Set new status
        const response = await fetch(`/api/events/${eventId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            comment: comment || null,
          }),
        });

        if (response.ok) {
          setStatus(newStatus);
          setShowComment(true);
        }
      }
      onStatusChange?.();
      // Refresh the page to show updated counts
      window.location.reload();
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSave = async () => {
    if (!status) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comment: comment || null,
        }),
      });
      onStatusChange?.();
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => handleStatusChange('GOING')}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-colors
            ${status === 'GOING'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          ✓ Going
        </button>
        <button
          onClick={() => handleStatusChange('INTERESTED')}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-colors
            ${status === 'INTERESTED'
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          ★ Interested
        </button>
      </div>

      {showComment && (
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Add a comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={handleCommentSave}
            placeholder="e.g., Section 105, Row F, Seat 9"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Comment saves automatically when you click away
          </p>
        </div>
      )}
    </div>
  );
}

