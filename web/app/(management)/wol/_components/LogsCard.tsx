'use client';

import { useMemo } from 'react';

import { formatRelative, formatTime } from '../_lib/format';
import type { LogEntry } from '../_lib/types';
import { useLanguage } from '../../../_i18n/LanguageProvider';

type LogsCardProps = {
  logs: LogEntry[];
  onClear: () => void;
};

export function LogsCard({ logs, onClear }: LogsCardProps) {
  const { t } = useLanguage();
  const statusLabels = useMemo<Record<LogEntry['status'], string>>(
    () => ({
      pending: t('wol.logs.status.pending'),
      success: t('wol.logs.status.success'),
      error: t('wol.logs.status.error')
    }),
    [t]
  );

  const title = t('wol.logs.title');
  const subtitle = t('wol.logs.subtitle');
  const clearLabel = t('wol.logs.clear');
  const emptyState = t('wol.logs.empty');
  const targetLabel = t('wol.logs.targetLabel');

  return (
    <section className="card logs-card">
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="card-subtitle">{subtitle}</p>
        </div>
        <div className="header-actions compact">
          <button className="btn ghost" id="logs-clear" onClick={onClear} disabled={logs.length === 0}>
            {clearLabel}
          </button>
        </div>
      </div>
      <div className="logs-list" id="logs-list">
        {logs.length === 0 ? (
          <div className="empty-state">{emptyState}</div>
        ) : (
          logs.map((entry) => {
            const actionClass = `action-log-item action-log-item--${entry.action}`;
            const statusClass = `action-log-status action-log-status--${entry.status}`;
            const actionLabel = t(`wol.actions.labels.${entry.action}`);

            return (
              <article className={actionClass} key={entry.id}>
                <header className="action-log-header">
                  <span className="action-log-action">{actionLabel}</span>
                  <span className={statusClass}>{statusLabels[entry.status]}</span>
                  <span className="action-log-time" title={new Date(entry.timestamp).toLocaleString()}>
                    {formatTime(entry.timestamp)} · {formatRelative(entry.timestamp, t)}
                  </span>
                </header>
                <div className="action-log-body">
                  <span className="action-log-target" aria-label={targetLabel}>
                    {entry.target}
                  </span>
                  <p className="action-log-message">{entry.message}</p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
