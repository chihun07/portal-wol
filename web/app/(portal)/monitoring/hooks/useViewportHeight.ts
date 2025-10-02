'use client';

import { useEffect } from 'react';

export function useViewportHeight(variable: string) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const update = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty(variable, `${vh * 100}px`);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [variable]);
}
