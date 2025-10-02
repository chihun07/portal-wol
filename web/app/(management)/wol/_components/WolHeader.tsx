'use client';

import Link from 'next/link';
import type { ChangeEventHandler } from 'react';
import { MoonIcon, SunIcon } from '../../../_components/ThemeIcons';

type WolHeaderProps = {
  filter: string;
  onFilterChange: ChangeEventHandler<HTMLInputElement>;
  onRefreshStatus: () => void;
  onOpenPortal: () => void;
  onToggleTheme: () => void;
  onAddTarget: () => void;
  theme: 'light' | 'dark';
  themeReady: boolean;
};

export function WolHeader({
  filter,
  onFilterChange,
  onRefreshStatus,
  onOpenPortal,
  onToggleTheme,
  onAddTarget,
  theme,
  themeReady
}: WolHeaderProps) {
  const themeLabel = theme === 'light' ? 'Dark' : 'Light';
  const themeAriaLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  const ThemeIcon = theme === 'light' ? MoonIcon : SunIcon;

  return (
    <header className="page-header">
      <div className="title-block">
        <h1>WOL-Web</h1>
        <p>Control Wake-on-LAN and power actions for your Tailnet devices.</p>
      </div>
      <div className="header-actions">
        <input
          id="target-filter"
          type="search"
          placeholder="Search name or IP"
          value={filter}
          onChange={onFilterChange}
          autoComplete="off"
        />
        <button className="btn ghost" id="status-refresh" onClick={onRefreshStatus}>
          Refresh Status
        </button>
        <button className="btn secondary" id="open-portal" type="button" aria-haspopup="dialog" onClick={onOpenPortal}>
          Monitoring Window
        </button>
        <button
          id="theme-toggle"
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={themeAriaLabel}
        >
          {themeReady ? (
            <ThemeIcon className="theme-toggle__icon" focusable="false" />
          ) : (
            <SunIcon className="theme-toggle__icon" focusable="false" />
          )}
          <span id="theme-label">{themeLabel}</span>
        </button>
        <button className="btn primary" id="add-target" onClick={onAddTarget}>
          + Add Target
        </button>
      </div>
    </header>
  );
}

export function PortalBanner() {
  return (
    <section className="portal-inline-banner" aria-labelledby="portal-inline-banner-title">
      <div className="portal-inline-banner__text">
        <h2 id="portal-inline-banner-title">Monitoring Portal</h2>
        <p>Open the monitoring portal anytime for dashboards and telemetry.</p>
      </div>
      <Link className="btn secondary portal-inline-banner__link" href="/">
        Open Portal
      </Link>
    </section>
  );
}
