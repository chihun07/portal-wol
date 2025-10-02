'use client';

import { useBodyClass } from '../../_hooks/useBodyClass';
import { useTheme } from '../../_hooks/useTheme';

import { PortalFrame } from './components/PortalFrame';
import { PortalHeader } from './components/PortalHeader';
import { usePortalView } from './hooks/usePortalView';
import { useViewportHeight } from './hooks/useViewportHeight';

export default function MonitoringPage() {
  useBodyClass('portal-body');
  useViewportHeight('--portal-vh');

  const { theme, toggleTheme, ready } = useTheme();
  const { view, selectView, iframeSrc, refresh } = usePortalView();

  return (
    <>
      <PortalHeader
        activeView={view}
        onSelectView={selectView}
        onRefresh={refresh}
        onToggleTheme={toggleTheme}
        theme={theme}
        themeReady={ready}
      />
      <PortalFrame src={iframeSrc} />
    </>
  );
}
