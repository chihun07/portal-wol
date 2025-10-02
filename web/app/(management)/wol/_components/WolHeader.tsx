'use client';

import Link from 'next/link';
import type { ChangeEventHandler } from 'react';

import { LanguageToggle } from '../../../_components/LanguageToggle';
import { MoonIcon, SunIcon } from '../../../_components/ThemeIcons';
import { useLanguage } from '../../../_i18n/LanguageProvider';

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
  const { t } = useLanguage();
  const themeLabel = theme === 'light' ? t('common.theme.dark') : t('common.theme.light');
  const themeAriaLabel = theme === 'light' ? t('common.theme.switchToDark') : t('common.theme.switchToLight');
  const ThemeIcon = theme === 'light' ? MoonIcon : SunIcon;
  const title = t('wol.header.title');
  const subtitle = t('wol.header.subtitle');
  const searchPlaceholder = t('wol.header.searchPlaceholder');
  const refreshLabel = t('wol.header.refresh');
  const portalLabel = t('wol.header.portal');
  const addTargetLabel = t('wol.header.addTarget');

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
        <LanguageToggle />
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
