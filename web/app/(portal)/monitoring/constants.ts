import type { TranslateFn } from '../../_i18n/LanguageProvider';

export type PortalView = 'grafana' | 'prom' | 'kuma' | 'netdata';

export const PORTAL_VIEWS: PortalView[] = ['grafana', 'prom', 'kuma', 'netdata'];

const DEFAULT_PORTAL_ROUTES: Record<PortalView, string> = {
  grafana: 'https://mon-core.tail85b0de.ts.net:445/',
  prom: 'https://mon-core.tail85b0de.ts.net/prometheus/targets',
  kuma: 'https://mon-core.tail85b0de.ts.net:444/status/portal',
  netdata: 'https://mon-core.tail85b0de.ts.net/netdata/'
};

function env(key: string, fallback: string): string {
  const value = process.env[key];
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return fallback;
}

export const PORTAL_ROUTES: Record<PortalView, string> = {
  grafana: env('NEXT_PUBLIC_GRAFANA_URL', DEFAULT_PORTAL_ROUTES.grafana),
  prom: env('NEXT_PUBLIC_PROM_URL', DEFAULT_PORTAL_ROUTES.prom),
  kuma: env('NEXT_PUBLIC_KUMA_URL', DEFAULT_PORTAL_ROUTES.kuma),
  netdata: env('NEXT_PUBLIC_NETDATA_URL', DEFAULT_PORTAL_ROUTES.netdata)
};

export type PortalLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  accent?: boolean;
};

type PortalLinkDefinition = Omit<PortalLink, 'label'> & { labelKey: string };

const PORTAL_LINK_DEFINITIONS: PortalLinkDefinition[] = [
  { id: 'grafana', labelKey: 'monitoring.links.grafana', href: PORTAL_ROUTES.grafana, external: true },
  { id: 'prom', labelKey: 'monitoring.links.prom', href: PORTAL_ROUTES.prom, external: true },
  { id: 'kuma', labelKey: 'monitoring.links.kuma', href: PORTAL_ROUTES.kuma, external: true },
  { id: 'netdata', labelKey: 'monitoring.links.netdata', href: PORTAL_ROUTES.netdata, external: true },
  { id: 'wol', labelKey: 'monitoring.links.wol', href: '/wol', accent: true }
];

export function getPortalLinks(t: TranslateFn): PortalLink[] {
  return PORTAL_LINK_DEFINITIONS.map(({ labelKey, ...link }) => ({
    ...link,
    label: t(labelKey)
  }));
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
