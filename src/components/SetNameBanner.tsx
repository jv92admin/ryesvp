'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SetNameBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has a display name
    const checkName = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const json = await res.json();
          if (!json.user.displayName) {
            // Check if already dismissed this session
            const wasDismissed = sessionStorage.getItem('name-banner-dismissed');
            if (!wasDismissed) {
              setShow(true);
            }
          }
        }
      } catch {
        // Ignore errors
      }
    };
    checkName();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('name-banner-dismissed', 'true');
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div className="bg-green-50 border-b border-green-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-green-800">
          <span className="font-medium">👋 Add your name</span> so friends can recognize you!
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="btn-primary px-3 py-1 text-sm font-medium rounded-lg transition-colors"
          >
            Set Name
          </Link>
          <button
            onClick={handleDismiss}
            className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

