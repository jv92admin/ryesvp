'use client';

import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ message, type = 'info', duration = 8000, onClose, action }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-[var(--brand-primary-light)] border-[var(--brand-primary)]/30',
      text: 'text-gray-900',
      icon: '✓',
      iconBg: 'bg-[var(--brand-primary)]',
    },
    info: {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-900',
      icon: 'ℹ',
      iconBg: 'bg-gray-700',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-gray-900',
      icon: '✕',
      iconBg: 'bg-red-600',
    },
  }[type];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-slide-up">
      <div className={`${styles.bg} ${styles.text} px-3 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 w-full sm:max-w-md`}>
        {/* Icon */}
        <div className={`${styles.iconBg} text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
          {styles.icon}
        </div>
        
        {/* Message */}
        <p className="text-xs font-bold flex-1">{message}</p>
        
        {/* Action button */}
        {action && (
          <button
            onClick={(e) => {
              e.preventDefault();
              action.onClick();
            }}
            className="flex-shrink-0 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
            aria-label={action.label}
          >
            {/* Copy icon - 2 overlapping squares */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

