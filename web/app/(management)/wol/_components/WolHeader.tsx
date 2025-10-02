'use client';

import Link from 'next/link';
import type { ChangeEventHandler } from 'react';

import { useLanguage } from '../../../_i18n/LanguageProvider';

type WolHeaderProps = {
  filter: string;
  onFilterChange: ChangeEventHandler<HTMLInputElement>;
  onRefreshStatus: () => void;
  onOpenPortal: () => void;
  onAddTarget: () => void;
};

export function WolHeader({ filter, onFilterChange, onRefreshStatus, onOpenPortal, onAddTarget }: WolHeaderProps) {
  const { t } = useLanguage();
  const title = t('wol.header.title');
  const subtitle = t('wol.header.subtitle');
  const searchPlaceholder = t('wol.header.searchPlaceholder');
  const refreshLabel = t('wol.header.refresh');
  const portalLabel = t('wol.header.portal');
  const addTargetLabel = t('wol.header.addTarget');
  const settingsLabel = t('settings.linkLabel');

  return (
    <header className="page-header">
      <div className="title-block">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">
        <input
          id="target-filter"
          type="search"
          placeholder={searchPlaceholder}
          value={filter}
          onChange={onFilterChange}
          autoComplete="off"
        />
        <button className="btn ghost" id="status-refresh" onClick={onRefreshStatus}>
          {refreshLabel}
        </button>
        <button className="btn secondary" id="open-portal" type="button" aria-haspopup="dialog" onClick={onOpenPortal}>
          {portalLabel}
        </button>
        <Link className="btn ghost settings-link" href="/settings">
          {settingsLabel}
        </Link>
        <button className="btn primary" id="add-target" onClick={onAddTarget}>
          {addTargetLabel}
        </button>
      </div>
    </header>
  );
}

export function PortalBanner() {
  const { t } = useLanguage();

  return (
    <section className="portal-inline-banner" aria-labelledby="portal-inline-banner-title">
      <div className="portal-inline-banner__text">
        <h2 id="portal-inline-banner-title">{t('wol.banner.title')}</h2>
        <p>{t('wol.banner.description')}</p>
      </div>
      <Link className="btn secondary portal-inline-banner__link" href="/">
        {t('wol.banner.open')}
      </Link>
    </section>
  );
}
