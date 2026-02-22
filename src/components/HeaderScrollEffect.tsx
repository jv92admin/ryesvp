'use client';

import { useEffect } from 'react';

/**
 * Adds/removes `header-scrolled` class on the <header> element
 * based on scroll position. Border appears when scrollY > 0.
 */
export function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 0) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}
