'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { PORTAL_ROUTES, PORTAL_VIEWS, type PortalView } from '../constants';

function resolveInitialView(): PortalView {
  if (typeof window === 'undefined') {
    return 'grafana';
  }
  const hash = window.location.hash?.slice(1) as PortalView | undefined;
  if (hash && PORTAL_VIEWS.includes(hash)) {
    return hash;
  }
  return 'grafana';
}

export function usePortalView() {
  const [view, setView] = useState<PortalView>(() => resolveInitialView());
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash?.slice(1) as PortalView | undefined;
      if (hash && PORTAL_VIEWS.includes(hash)) {
        setView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.history.replaceState(null, '', `#${view}`);
  }, [view]);

  const baseSrc = PORTAL_ROUTES[view] ?? PORTAL_ROUTES.grafana;

  const iframeSrc = useMemo(() => {
    if (!refreshToken) {
      return baseSrc;
    }
    const joiner = baseSrc.includes('?') ? '&' : '?';
    return `${baseSrc}${joiner}_=${refreshToken}`;
  }, [baseSrc, refreshToken]);

  const selectView = useCallback((next: PortalView) => {
    setView(next);
    setRefreshToken(0);
  }, []);

  const refresh = useCallback(() => {
    setRefreshToken(Date.now());
  }, []);

  return {
    view,
    selectView,
    iframeSrc,
    refresh
  };
}
