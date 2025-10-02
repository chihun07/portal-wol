'use client';

import { ACTION_LABELS } from '../_lib/constants';
import { formatRelative, formatTime } from '../_lib/format';
import type { LogEntry } from '../_lib/types';

const STATUS_LABELS: Record<LogEntry['status'], string> = {
  pending: 'In Progress',
  success: 'Success',
  error: 'Failed'
};

type LogsCardProps = {
  logs: LogEntry[];
  onClear: () => void;
};

export function LogsCard({ logs, onClear }: LogsCardProps) {
  return (
    <section className="card logs-card">
      <div className="card-header">
        <div>
          <h2>Action History</h2>
          <p className="card-subtitle">Only commands you trigger from this page are listed.</p>
        </div>
        <div className="header-actions compact">
          <button className="btn ghost" id="logs-clear" onClick={onClear} disabled={logs.length === 0}>
            Clear
          </button>
        </div>
      </div>
      <div className="logs-list" id="logs-list">
        {logs.length === 0 ? (
          <div className="empty-state">No actions yet. Use the controls above to send a command.</div>
        ) : (
          logs.map((entry) => {
            const actionClass = `action-log-item action-log-item--${entry.action}`;
            const statusClass = `action-log-status action-log-status--${entry.status}`;
            const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;

            return (
              <article className={actionClass} key={entry.id}>
                <header className="action-log-header">
                  <span className="action-log-action">{actionLabel}</span>
                  <span className={statusClass}>{STATUS_LABELS[entry.status]}</span>
                  <span className="action-log-time" title={new Date(entry.timestamp).toLocaleString()}>
                    {formatTime(entry.timestamp)} · {formatRelative(entry.timestamp)}
                  </span>
                </header>
                <div className="action-log-body">
                  <span className="action-log-target" aria-label="Target">
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
