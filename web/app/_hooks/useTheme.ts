'use client';

import { useCallback, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'wolweb_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const resolved = stored === 'light' ? 'light' : 'dark';
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    setReady(true);
  }, []);

  const applyTheme = useCallback((value: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    setThemeState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.setAttribute('data-theme', next);
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [applyTheme]);

  return {
    theme,
    ready,
    setTheme: applyTheme,
    toggleTheme
  };
}
