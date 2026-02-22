'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

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

/**
 * Lark Toast — all types use `--bg-elevated` + `--border-subtle`.
 * Monochrome icons. Only error gets `--status-need-ticket` icon.
 * Enters from bottom with spring, exits with slide-down.
 */
export function Toast({ message, type = 'info', duration = 8000, onClose, action }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const iconConfig = {
    success: { icon: '\u2713', iconColor: 'text-[var(--lark-text-primary)]' },
    info: { icon: 'i', iconColor: 'text-[var(--lark-text-secondary)]' },
    error: { icon: '!', iconColor: 'text-[var(--status-need-ticket)]' },
  }[type];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] flex items-center gap-2.5 w-full sm:max-w-md">
          {/* Icon */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border border-[var(--border-visible)] ${iconConfig.iconColor}`}>
            {iconConfig.icon}
          </div>

          {/* Message */}
          <p className="text-xs font-medium flex-1">{message}</p>

          {/* Action button */}
          {action && (
            <button
              onClick={(e) => {
                e.preventDefault();
                action.onClick();
              }}
              className="flex-shrink-0 text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] transition-colors"
              aria-label={action.label}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[var(--lark-text-muted)] hover:text-[var(--lark-text-primary)] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
