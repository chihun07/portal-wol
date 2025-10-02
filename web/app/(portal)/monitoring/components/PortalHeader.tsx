'use client';

import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';

import {
  PORTAL_LINKS,
  PORTAL_VIEWS,
  formatPortalViewLabel,
  type PortalLink,
  type PortalView
} from '../constants';
import { MoonIcon, SunIcon } from '../../../_components/ThemeIcons';

type PortalHeaderProps = {
  activeView: PortalView;
  onSelectView: (view: PortalView) => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  themeReady: boolean;
};

function renderLink(link: PortalLink, onNavigate?: () => void) {
  if (link.external) {
    return (
      <a className={`portal-link${link.accent ? ' portal-link--cta' : ''}`} href={link.href} target="_blank" rel="noopener">
        {link.label}
      </a>
    );
  }

  return (
    <Link className={`portal-link${link.accent ? ' portal-link--cta' : ''}`} href={link.href as any} onClick={onNavigate}>
      {link.label}
    </Link>
  );
}

function renderMenuItem(link: PortalLink, onNavigate?: () => void) {
  if (link.external) {
    return (
      <a className={`portal-menu__item${link.accent ? ' portal-link--cta' : ''}`} href={link.href} target="_blank" rel="noopener" role="menuitem">
        {link.label}
      </a>
    );
  }

  return (
    <Link
      className={`portal-menu__item${link.accent ? ' portal-link--cta' : ''}`}
      href={link.href as any}
      role="menuitem"
      onClick={onNavigate}
    >
      {link.label}
    </Link>
  );
}

export function PortalHeader({ activeView, onSelectView, onRefresh, onToggleTheme, theme, themeReady }: PortalHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.portal-menu')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  const themeLabel = theme === 'light' ? 'Dark' : 'Light';
  const themeAriaLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  const ThemeIcon = theme === 'light' ? MoonIcon : SunIcon;

  return (
    <header className="portal-header">
      <div className="portal-headbar">
        <span className="portal-title">Monitoring Portal</span>
        <div className="portal-spacer" />
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
        <nav className="portal-links" aria-label="Monitoring services">
          {PORTAL_LINKS.map((link) => (
            <Fragment key={link.id}>{renderLink(link)}</Fragment>
          ))}
        </nav>
        <div className="portal-menu" ref={menuRef}>
          <button
            id="portal-menu-toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            More
          </button>
          <div className="portal-menu__dropdown" id="portal-menu" role="menu" aria-hidden={!menuOpen}>
            {PORTAL_LINKS.map((link) => (
              <Fragment key={link.id}>{renderMenuItem(link, () => setMenuOpen(false))}</Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="portal-tabs" role="tablist">
        <button
          type="button"
          id="portal-refresh"
          className="portal-tabs__button portal-tabs__button--refresh"
          aria-label="Refresh current view"
          onClick={onRefresh}
        >
          ↻
        </button>
        {PORTAL_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            className={`portal-tabs__button${activeView === view ? ' active' : ''}`}
            data-view={view}
            aria-selected={activeView === view}
            onClick={() => onSelectView(view)}
          >
            {formatPortalViewLabel(view)}
          </button>
        ))}
      </div>
    </header>
  );
}
