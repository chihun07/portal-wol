export type PortalView = 'grafana' | 'prom' | 'kuma' | 'netdata';

export const PORTAL_VIEWS: PortalView[] = ['grafana', 'prom', 'kuma', 'netdata'];

export const PORTAL_ROUTES: Record<PortalView, string> = {
  grafana: 'https://mon-core.tail85b0de.ts.net:445/',
  prom: 'https://mon-core.tail85b0de.ts.net/prometheus/targets',
  kuma: 'https://mon-core.tail85b0de.ts.net:444/status/portal',
  netdata: 'https://mon-core.tail85b0de.ts.net/netdata/'
};

export type PortalLink = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  accent?: boolean;
};

export const PORTAL_LINKS: PortalLink[] = [
  { id: 'grafana', label: 'Open Grafana', href: PORTAL_ROUTES.grafana, external: true },
  { id: 'prom', label: 'Prometheus Targets', href: PORTAL_ROUTES.prom, external: true },
  { id: 'kuma', label: 'Uptime Kuma', href: PORTAL_ROUTES.kuma, external: true },
  { id: 'netdata', label: 'Netdata', href: PORTAL_ROUTES.netdata, external: true },
  { id: 'wol', label: 'WOL Control', href: '/wol', accent: true }
];

export function formatPortalViewLabel(view: PortalView): string {
  switch (view) {
    case 'grafana':
      return 'Grafana';
    case 'prom':
      return 'Prometheus';
    case 'kuma':
      return 'Uptime Kuma';
    case 'netdata':
      return 'Netdata';
    default:
      return view;
  }
}
