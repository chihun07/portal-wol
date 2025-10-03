'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
type ConfigStatus = 'idle' | 'saving' | 'success';

const INITIAL_TARGET_FORM: TargetFormState = { name: '', ip: '', mac: '' };
type PortalRouteDrafts = Partial<Record<PortalView, string | undefined>>;

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="settings-suspense" aria-hidden="true" />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  useBodyClass('settings-body');

  const router = useRouter();
  const searchParams = useSearchParams();

  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { ready, routes, overrides, setRoute, resetRoutes } = usePortalConfig();

  const [targetForm, setTargetForm] = useState<TargetFormState>(INITIAL_TARGET_FORM);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('idle');
  const [targetMessage, setTargetMessage] = useState('');
  const [routeDrafts, setRouteDrafts] = useState<PortalRouteDrafts>({});
  const [configStatus, setConfigStatus] = useState<ConfigStatus>('idle');

  // ===== 안전한 내부 경로 검증 유틸 =====
  const isSafeInternalPath = (path: string | null | undefined) => {
    if (!path) return false;
    if (!path.startsWith('/')) return false;   // 내부 경로만 허용
    if (path.startsWith('//')) return false;   // 프로토콜 상대 우회 방지
    if (/\s/.test(path)) return false;         // 공백 방지
    return true;
  };

  // 1) 쿼리 파라미터로 전달된 returnTo
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = isSafeInternalPath(rawReturnTo) ? rawReturnTo! : null;

  // 2) 같은 오리진에서 넘어온 경우 document.referrer 기반 경로 확보
  const [refPath, setRefPath] = useState<string | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    try {
      if (!document.referrer) return;
      const refUrl = new URL(document.referrer);
      // 같은 오리진에서 왔고, 내부 경로면 사용
      if (refUrl.origin === window.location.origin) {
        const composed = `${refUrl.pathname}${refUrl.search}${refUrl.hash}`;
        if (isSafeInternalPath(refUrl.pathname)) {
          setRefPath(composed || '/');
        }
      }
    } catch {
      // 무시
    }
  }, []);

  // 최종 목적지: returnTo ▶︎ refPath ▶︎ '/'
  const exitHref = returnTo ?? refPath ?? '/';

  const updateTargetForm = (patch: Partial<TargetFormState>) => {
    setTargetStatus('idle');
    setTargetMessage('');
    setTargetForm((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    if (!ready) return;
    setRouteDrafts({ ...overrides });
  }, [overrides, ready]);

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
  const monitoringHint = t('settings.monitoring.hint');
  const monitoringSaved = t('settings.monitoring.saved');
  const monitoringSaving = t('settings.monitoring.saving');

  const targetTitle = t('settings.targets.title');
  const targetDescription = t('settings.targets.description');
  const targetSubmitLabel = t('settings.targets.submit');
  const targetSuccess = t('settings.targets.success');
  const targetError = t('settings.targets.error');
  const targetHint = t('settings.targets.hint');
  const exitLabel = t('settings.actions.exit');
  const saveLabel = t('settings.actions.save');
  const savingLabel = t('settings.actions.saving');

  const hasUnsavedChanges = useMemo(() => {
    return PORTAL_VIEWS.some((view) => {
      if (!Object.prototype.hasOwnProperty.call(routeDrafts, view)) return false;
      const draftValue = routeDrafts[view] ?? '';
      const currentValue = overrides[view] ?? '';
      return draftValue !== currentValue;
    });
  }, [overrides, routeDrafts]);

  const resolveDraftValue = (view: PortalView) => {
    if (Object.prototype.hasOwnProperty.call(routeDrafts, view)) {
      return routeDrafts[view] ?? '';
    }
    return undefined;
  };

  const handleRouteDraftChange = (view: PortalView, value: string) => {
    setRouteDrafts((prev) => ({ ...prev, [view]: value }));
    setConfigStatus('idle');
  };

  const handleConfigSave = () => {
    if (!ready) return;
    setConfigStatus('saving');
    const normalizedDrafts: PortalRouteDrafts = {};
    PORTAL_VIEWS.forEach((view) => {
      const draftValue = Object.prototype.hasOwnProperty.call(routeDrafts, view)
        ? (routeDrafts[view] ?? '')
        : overrides[view] ?? '';
      const normalized = draftValue.trim();
      setRoute(view, normalized);
      if (Object.prototype.hasOwnProperty.call(routeDrafts, view)) {
        normalizedDrafts[view] = normalized;
      }
    });
    setRouteDrafts((prev) => {
      const next: PortalRouteDrafts = { ...prev };
      PORTAL_VIEWS.forEach((view) => {
        if (Object.prototype.hasOwnProperty.call(normalizedDrafts, view)) {
          const normalized = normalizedDrafts[view] ?? '';
          if (normalized) next[view] = normalized;
          else delete next[view];
        }
      });
      return next;
    });
    setConfigStatus('success');
  };

  const handleResetRoutes = () => {
    if (!ready) return;
    resetRoutes();
    setRouteDrafts({});
    setConfigStatus('idle');
  };

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
  };

  const handleThemeChange = (value: 'light' | 'dark') => {
    setTheme(value);
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
      if (mac) payload.mac = mac;

      await request('api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          : typeof (detail as any)?.detail === 'string'
            ? (detail as any).detail
            : typeof (detail as any)?.message === 'string'
              ? (detail as any).message
              : targetError;
      setTargetStatus('error');
      setTargetMessage(message);
    }
  };

  const configButtonLabel = configStatus === 'saving' ? savingLabel : saveLabel;
  const configMessage =
    configStatus === 'success' ? monitoringSaved : configStatus === 'saving' ? monitoringSaving : monitoringHint;

  return (
    <main className="settings-page">
      <header className="settings-header">
        <div className="settings-header__content">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
        <div className="settings-header__actions">
          {/* 접근성/SEO를 위해 href는 항상 설정, 클릭 시 SPA 네비게이션 제어 */}
          <Link
            href={exitHref as any}
            className="btn ghost"
            onClick={(e) => {
              e.preventDefault();
              // returnTo가 없고, 히스토리가 충분하면 back()이 자연스러움
              if (!returnTo && typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push(exitHref as any);
              }
            }}
          >
            {exitLabel}
          </Link>
          <button
            type="button"
            className="btn primary"
            onClick={handleConfigSave}
            disabled={!ready || !hasUnsavedChanges || configStatus === 'saving'}
          >
            {configButtonLabel}
          </button>
        </div>
      </header>

      <section className="settings-grid">
        <article className="settings-card">
          <h2>{appearanceTitle}</h2>
          <p className="settings-card__description">{appearanceDescription}</p>
          <div className="settings-options">
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className={`settings-option${theme === option.value ? ' selected' : ''}`}
              >
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
              <label
                key={option.value}
                className={`settings-option${language === option.value ? ' selected' : ''}`}
              >
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
            <button
              type="button"
              className="btn ghost"
              onClick={handleResetRoutes}
              disabled={!ready || configStatus === 'saving'}
            >
              {monitoringResetLabel}
            </button>
          </div>

          <p className={`settings-message${configStatus === 'success' ? ' settings-message--success' : ''}`}>
            {configMessage}
          </p>

          <div className="settings-fields">
            {PORTAL_VIEWS.map((view) => {
              const label = t(`settings.monitoring.labels.${view}`);
              const envKey = PORTAL_ENV_KEYS[view];
              const defaultValue = DEFAULT_PORTAL_ROUTES[view];
              const overrideValue = overrides[view] ?? '';
              const draftValue = resolveDraftValue(view);

              return (
                <label key={view} className="settings-field">
                  <span className="settings-field__label">{label}</span>
                  <input
                    type="url"
                    value={draftValue ?? (overrideValue || routes[view])}
                    placeholder={defaultValue}
                    onChange={(event) => handleRouteDraftChange(view, event.target.value)}
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

