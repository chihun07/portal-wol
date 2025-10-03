'use client';

import { useEffect } from 'react';

export function useBodyClass(className: string) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const { body } = document;
    const previous = body.className;
    body.className = className;
    return () => {
      body.className = previous;
    };
  }, [className]);
}
