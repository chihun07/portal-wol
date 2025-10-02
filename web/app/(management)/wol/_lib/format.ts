import type { TranslateFn } from '../../../_i18n/LanguageProvider';

function translateRelative(
  key: 'justNow' | 'minutesAgo' | 'hoursAgo',
  t?: TranslateFn,
  count?: number
): string {
  if (t) {
    return t(`format.relative.${key}`, count !== undefined ? { count } : undefined);
  }
  switch (key) {
    case 'justNow':
      return 'just now';
    case 'minutesAgo':
      return `${count ?? 0} min ago`;
    case 'hoursAgo':
      return `${count ?? 0} hr ago`;
    default:
      return '';
  }
}

export function formatRelative(ts?: string | null, t?: TranslateFn): string {
  if (!ts) return '-';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return translateRelative('justNow', t);
  if (abs < hour) return translateRelative('minutesAgo', t, Math.round(abs / minute));
  if (abs < day) return translateRelative('hoursAgo', t, Math.round(abs / hour));
  return date.toLocaleString();
}

export function formatTime(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
