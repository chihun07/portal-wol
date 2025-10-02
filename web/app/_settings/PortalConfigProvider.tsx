'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { PORTAL_VIEWS, resolvePortalRoutes, type PortalView } from '../(portal)/monitoring/constants';

type PortalRouteOverrides = Partial<Record<PortalView, string>>;

type PortalConfigContextValue = {
  ready: boolean;
  routes: Record<PortalView, string>;
  overrides: PortalRouteOverrides;
  setRoute: (view: PortalView, url: string) => void;
  resetRoutes: () => void;
};

const STORAGE_KEY = 'portal-config';

const PortalConfigContext = createContext<PortalConfigContextValue | undefined>(undefined);

function normalizeUrl(value: string): string {
  return value.trim();
}

export function PortalConfigProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<PortalRouteOverrides>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PortalRouteOverrides | null;
        if (parsed && typeof parsed === 'object') {
          setOverrides(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load portal config', error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') {
      return;
    }
    try {
      const serialized = JSON.stringify(overrides);
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('Failed to persist portal config', error);
    }
  }, [overrides, ready]);

  const routes = useMemo(() => resolvePortalRoutes(overrides), [overrides]);

  const value = useMemo<PortalConfigContextValue>(() => ({
    ready,
    routes,
    overrides,
    setRoute: (view: PortalView, url: string) => {
      setOverrides((prev) => {
        const next = normalizeUrl(url);
        if (!next) {
          const { [view]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [view]: next };
      });
    },
    resetRoutes: () => {
      setOverrides({});
    }
  }), [overrides, ready, routes]);

  return <PortalConfigContext.Provider value={value}>{children}</PortalConfigContext.Provider>;
}

export function usePortalConfig(): PortalConfigContextValue {
  const context = useContext(PortalConfigContext);
  if (!context) {
    throw new Error('usePortalConfig must be used within a PortalConfigProvider');
  }
  return context;
}

