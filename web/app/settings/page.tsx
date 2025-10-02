'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

import { useBodyClass } from '../_hooks/useBodyClass';
import { useTheme } from '../_hooks/useTheme';
import { useLanguage } from '../_i18n/LanguageProvider';
import type { Language } from '../_i18n/LanguageProvider';
import { usePortalConfig } from '../_settings/PortalConfigProvider';
import {
  DEFAULT_PORTAL_ROUTES,
  PORTAL_ENV_KEYS,
  PORTAL_VIEWS,
  type PortalView
} from '../(portal)/monitoring/constants';
import { request } from '../(management)/wol/_lib/api';
import type { RequestError, TargetFormState } from '../(management)/wol/_lib/types';

type TargetStatus = 'idle' | 'saving' | 'success' | 'error';

const INITIAL_TARGET_FORM: TargetFormState = { name: '', ip: '', mac: '' };

export default function SettingsPage() {
  useBodyClass('settings-body');

  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { routes, overrides, setRoute, resetRoutes } = usePortalConfig();

  const [targetForm, setTargetForm] = useState<TargetFormState>(INITIAL_TARGET_FORM);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('idle');
  const [targetMessage, setTargetMessage] = useState('');

  const updateTargetForm = (patch: Partial<TargetFormState>) => {
    setTargetStatus('idle');
    setTargetMessage('');
    setTargetForm((prev) => ({ ...prev, ...patch }));
  };

  const appearanceTitle = t('settings.appearance.title');
  const appearanceDescription = t('settings.appearance.description');
  const themeOptions = useMemo(
    () => [
      { value: 'light' as const, label: t('settings.appearance.light') },
      { value: 'dark' as const, label: t('settings.appearance.dark') }
    ],
    [t]
  );

  const languageTitle = t('settings.language.title');
  const languageDescription = t('settings.language.description');
  const languageOptions = useMemo(
    () => [
      { value: 'ko' as Language, label: t('settings.language.korean') },
      { value: 'en' as Language, label: t('settings.language.english') }
    ],
    [t]
  );

  const monitoringTitle = t('settings.monitoring.title');
  const monitoringDescription = t('settings.monitoring.description');
  const monitoringResetLabel = t('settings.monitoring.reset');
  const monitoringStatusLabel = t('settings.monitoring.statusLabel');

  const targetTitle = t('settings.targets.title');
  const targetDescription = t('settings.targets.description');
  const targetSubmitLabel = t('settings.targets.submit');
  const targetSuccess = t('settings.targets.success');
  const targetError = t('settings.targets.error');
  const targetHint = t('settings.targets.hint');

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
  };

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
  };

  const handleRouteChange = (view: PortalView, value: string) => {
    setRoute(view, value);
  };

  const handleTargetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = targetForm.name.trim();
    const ip = targetForm.ip.trim();
    const mac = targetForm.mac.trim();
    if (!name || !ip) {
      setTargetMessage(targetError);
      setTargetStatus('error');
      return;
    }

    setTargetStatus('saving');
    setTargetMessage('');
    try {
      const payload: Record<string, string> = { name, ip };
      if (mac) {
        payload.mac = mac;
      }

      await request('api/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      setTargetStatus('success');
      setTargetMessage(targetSuccess);
      setTargetForm(INITIAL_TARGET_FORM);
    } catch (error) {
      console.error(error);
      const detail = (error as RequestError)?.payload as { detail?: unknown; message?: unknown } | string | undefined;
      const message =
        typeof detail === 'string'
          ? detail
          : typeof detail?.detail === 'string'
            ? detail.detail
            : typeof detail?.message === 'string'
              ? detail.message
              : targetError;
      setTargetStatus('error');
      setTargetMessage(message);
    }
  };

  return (
    <main className="settings-page">
      <header className="settings-header">
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </header>
      <section className="settings-grid">
        <article className="settings-card">
          <h2>{appearanceTitle}</h2>
          <p className="settings-card__description">{appearanceDescription}</p>
          <div className="settings-options">
            {themeOptions.map((option) => (
              <label key={option.value} className={`settings-option${theme === option.value ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => handleThemeChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="settings-card">
          <h2>{languageTitle}</h2>
          <p className="settings-card__description">{languageDescription}</p>
          <div className="settings-options">
            {languageOptions.map((option) => (
              <label key={option.value} className={`settings-option${language === option.value ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={language === option.value}
                  onChange={() => handleLanguageChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="settings-card settings-card--wide">
          <div className="settings-card__header">
            <div>
              <h2>{monitoringTitle}</h2>
              <p className="settings-card__description">{monitoringDescription}</p>
            </div>
            <button type="button" className="btn ghost" onClick={resetRoutes}>
              {monitoringResetLabel}
            </button>
          </div>
          <div className="settings-fields">
            {PORTAL_VIEWS.map((view) => {
              const label = t(`settings.monitoring.labels.${view}`);
              const envKey = PORTAL_ENV_KEYS[view];
              const defaultValue = DEFAULT_PORTAL_ROUTES[view];
              const overrideValue = overrides[view] ?? '';
              return (
                <label key={view} className="settings-field">
                  <span className="settings-field__label">{label}</span>
                  <input
                    type="url"
                    value={overrideValue || routes[view]}
                    placeholder={defaultValue}
                    onChange={(event) => handleRouteChange(view, event.target.value)}
                  />
                  <small className="settings-field__hint">
                    {monitoringStatusLabel} <code>{envKey}</code>
                  </small>
                </label>
              );
            })}
          </div>
        </article>

        <article className="settings-card settings-card--wide">
          <h2>{targetTitle}</h2>
          <p className="settings-card__description">{targetDescription}</p>
          <form className="settings-form" onSubmit={handleTargetSubmit}>
            <div className="settings-fields">
              <label className="settings-field">
                <span className="settings-field__label">{t('wol.targetModal.fields.name')}</span>
                <input
                  value={targetForm.name}
                  onChange={(event) => updateTargetForm({ name: event.target.value })}
                  required
                  minLength={2}
                  maxLength={32}
                  pattern="[a-z0-9-]+"
                />
                <small className="settings-field__hint">{t('wol.targetModal.fields.nameHint')}</small>
              </label>
              <label className="settings-field">
                <span className="settings-field__label">{t('wol.targetModal.fields.ip')}</span>
                <input
                  value={targetForm.ip}
                  onChange={(event) => updateTargetForm({ ip: event.target.value })}
                  required
                  placeholder={t('wol.targetModal.fields.ipPlaceholder')}
                />
              </label>
              <label className="settings-field">
                <span className="settings-field__label">{t('wol.targetModal.fields.mac')}</span>
                <input
                  value={targetForm.mac}
                  onChange={(event) => updateTargetForm({ mac: event.target.value })}
                  placeholder={t('wol.targetModal.fields.macPlaceholder')}
                />
                <small className="settings-field__hint">{t('wol.targetModal.fields.macHint')}</small>
              </label>
            </div>
            <p className={`settings-message settings-message--${targetStatus}`} role="status">
              {targetMessage || targetHint}
            </p>
            <div className="settings-actions">
              <button type="submit" className="btn primary" disabled={targetStatus === 'saving'}>
                {targetStatus === 'saving' ? t('settings.targets.saving') : targetSubmitLabel}
              </button>
              <Link href="/wol" className="btn ghost">
                {t('settings.targets.manageLink')}
              </Link>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
