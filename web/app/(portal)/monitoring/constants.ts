import type { TranslateFn } from '../../_i18n/LanguageProvider';

export type PortalView = 'grafana' | 'prom' | 'kuma' | 'netdata';

export const PORTAL_VIEWS: PortalView[] = ['grafana', 'prom', 'kuma', 'netdata'];

export const DEFAULT_PORTAL_ROUTES: Record<PortalView, string> = {
  grafana: 'https://mon-core.tail85b0de.ts.net:445/',
  prom: 'https://mon-core.tail85b0de.ts.net/prometheus/targets',
  kuma: 'https://mon-core.tail85b0de.ts.net:444/status/portal',
  netdata: 'https://mon-core.tail85b0de.ts.net/netdata/'
};

export const PORTAL_ENV_KEYS: Record<PortalView, string> = {
  grafana: 'NEXT_PUBLIC_GRAFANA_URL',
  prom: 'NEXT_PUBLIC_PROM_URL',
  kuma: 'NEXT_PUBLIC_KUMA_URL',
  netdata: 'NEXT_PUBLIC_NETDATA_URL'
};

function env(key: string, fallback: string): string {
  const value = process.env[key];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return fallback;
}

export const ENV_PORTAL_ROUTES: Record<PortalView, string> = {
  grafana: env(PORTAL_ENV_KEYS.grafana, DEFAULT_PORTAL_ROUTES.grafana),
  prom: env(PORTAL_ENV_KEYS.prom, DEFAULT_PORTAL_ROUTES.prom),
  kuma: env(PORTAL_ENV_KEYS.kuma, DEFAULT_PORTAL_ROUTES.kuma),
  netdata: env(PORTAL_ENV_KEYS.netdata, DEFAULT_PORTAL_ROUTES.netdata)
};

export function resolvePortalRoutes(
  overrides: Partial<Record<PortalView, string>> = {}
): Record<PortalView, string> {
  return PORTAL_VIEWS.reduce<Record<PortalView, string>>((acc, view) => {
    const override = overrides[view];
    acc[view] = override && override.trim() ? override.trim() : ENV_PORTAL_ROUTES[view];
    return acc;
  }, {} as Record<PortalView, string>);
}

export type PortalLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  accent?: boolean;
};

export function getPortalLinks(
  t: TranslateFn,
  routes: Record<PortalView, string>
): PortalLink[] {
  return [
    { id: 'grafana', label: t('monitoring.links.grafana'), href: routes.grafana, external: true },
    { id: 'prom', label: t('monitoring.links.prom'), href: routes.prom, external: true },
    { id: 'kuma', label: t('monitoring.links.kuma'), href: routes.kuma, external: true },
    { id: 'netdata', label: t('monitoring.links.netdata'), href: routes.netdata, external: true },
    { id: 'wol', label: t('monitoring.links.wol'), href: '/wol', accent: true }
  ];
}

export function formatPortalViewLabel(view: PortalView, t: TranslateFn): string {
  switch (view) {
    case 'grafana':
      return t('monitoring.views.grafana');
    case 'prom':
      return t('monitoring.views.prom');
    case 'kuma':
      return t('monitoring.views.kuma');
    case 'netdata':
      return t('monitoring.views.netdata');
    default:
      return view;
  }
}
