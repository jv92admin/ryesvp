'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@prisma/client';

interface AttendanceButtonProps {
  eventId: string;
  currentStatus?: AttendanceStatus | null;
  currentComment?: string | null;
  onStatusChange?: () => void;
}

const STATUS_CONFIG = {
  INTERESTED: {
    label: '★ Interested',
    activeClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  GOING: {
    label: '✓ Going',
    activeClass: 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
  },
  NEED_TICKETS: {
    label: '🎫 Need Tickets',
    activeClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  HAVE_TICKETS: {
    label: '🎟️ Have Tickets',
    activeClass: 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
  },
} as const;

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
        // Set new status (mutually exclusive - only one at a time)
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

  const renderButton = (statusKey: keyof typeof STATUS_CONFIG) => {
    const config = STATUS_CONFIG[statusKey];
    const isActive = status === statusKey;
    
    return (
      <button
        onClick={() => handleStatusChange(statusKey)}
        disabled={isLoading}
        className={`
          flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm
          ${isActive
            ? config.activeClass
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {config.label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Attendance status */}
      <div className="flex gap-2">
        {renderButton('INTERESTED')}
        {renderButton('GOING')}
      </div>
      
      {/* Row 2: Ticket status */}
      <div className="flex gap-2">
        {renderButton('NEED_TICKETS')}
        {renderButton('HAVE_TICKETS')}
      </div>

      {showComment && (
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Add a note (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={handleCommentSave}
            placeholder={
              status === 'HAVE_TICKETS' 
                ? 'e.g., 2 GA tickets at face value'
                : status === 'NEED_TICKETS'
                ? 'e.g., Looking for 1 ticket, flexible on price'
                : 'e.g., Section 105, Row F'
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            Saves automatically
          </p>
        </div>
      )}
    </div>
  );
}

