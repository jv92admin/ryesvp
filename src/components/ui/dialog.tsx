'use client';

import { ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { IconButton } from './IconButton';

/* ─── Size Variants ─── */
type DialogSize = 'sm' | 'md' | 'lg' | 'sheet';

const sizeStyles: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  sheet: 'max-w-lg sm:max-w-md',
};

/* ─── Focus Trap ─── */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable element (or the container itself)
    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef]);
}

/* ─── Scroll Lock ─── */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = originalOverflow;
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

/* ─── Dialog (Root) ─── */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  size?: DialogSize;
}

export function Dialog({ open, onOpenChange, children, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useFocusTrap(contentRef, open && visible);
  useScrollLock(open);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleEscape]);

  // Mount/unmount with transition
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      className={clsx(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
        'transition-colors duration-200',
        visible ? 'bg-black/50' : 'bg-black/0'
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={clsx(
          'relative bg-[var(--surface-card)] w-full shadow-xl border border-[var(--border-default)]',
          'max-h-[90vh] flex flex-col',
          'outline-none',
          'transition-all duration-200',
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
          'rounded-t-2xl sm:rounded-xl',
          sizeStyles[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── DialogHeader ─── */
interface DialogHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function DialogHeader({ children, onClose, className }: DialogHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0',
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <IconButton
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          label="Close"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-2 flex-shrink-0"
        />
      )}
    </div>
  );
}

/* ─── DialogTitle ─── */
interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h3 className={clsx('text-lg font-semibold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  );
}

/* ─── DialogBody ─── */
interface DialogBodyProps {
  children: ReactNode;
  className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={clsx('flex-1 overflow-y-auto px-6 py-4', className)}>
      {children}
    </div>
  );
}

/* ─── DialogFooter ─── */
interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--surface-inset)] flex-shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── DialogContent (Legacy Compat) ─── */
interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={clsx('flex flex-col max-h-[85vh]', className)}>
      {children}
    </div>
  );
}
