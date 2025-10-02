export function formatRelative(ts?: string | null): string {
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
  if (abs < minute) return 'just now';
  if (abs < hour) return `${Math.round(abs / minute)} min ago`;
  if (abs < day) return `${Math.round(abs / hour)} hr ago`;
  return date.toLocaleString();
}

export function formatTime(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
