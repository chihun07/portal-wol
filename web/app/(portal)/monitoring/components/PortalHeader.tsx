'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import {
  PORTAL_VIEWS,
  getPortalLinks,
  formatPortalViewLabel,
  type PortalLink,
  type PortalView
} from '../constants';
import { useLanguage } from '../../../_i18n/LanguageProvider';
import { usePortalConfig } from '../../../_settings/PortalConfigProvider';

type PortalHeaderProps = {
  activeView: PortalView;
  onSelectView: (view: PortalView) => void;
  onRefresh: () => void;
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

export function PortalHeader({ activeView, onSelectView, onRefresh }: PortalHeaderProps) {
  const { t } = useLanguage();
  const { routes } = usePortalConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const portalLinks = useMemo(() => getPortalLinks(t, routes), [routes, t]);

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

  const portalTitle = t('monitoring.title');
  const moreLabel = t('monitoring.more');
  const navLabel = t('monitoring.services');
  const refreshLabel = t('monitoring.refresh');
  const settingsLabel = t('settings.linkLabel');

  return (
    <header className="portal-header">
      <div className="portal-headbar">
        <span className="portal-title">{portalTitle}</span>
        <div className="portal-spacer" />
        <Link className="btn ghost settings-link" href="/settings">
          {settingsLabel}
        </Link>
        <nav className="portal-links" aria-label={navLabel}>
          {portalLinks.map((link) => (
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
            {moreLabel}
          </button>
          <div className="portal-menu__dropdown" id="portal-menu" role="menu" aria-hidden={!menuOpen}>
            {portalLinks.map((link) => (
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
          aria-label={refreshLabel}
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
            {formatPortalViewLabel(view, t)}
          </button>
        ))}
      </div>
    </header>
  );
}
