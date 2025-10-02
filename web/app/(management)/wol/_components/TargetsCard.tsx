'use client';

import type { PowerAction, Target } from '../_lib/types';
import { formatRelative } from '../_lib/format';

type TargetsCardProps = {
  targets: Target[];
  filteredTargets: Target[];
  actionLoadingKey: string | null;
  onAction: (target: Target, action: PowerAction) => void;
  onEdit: (target: Target) => void;
  onDelete: (target: Target) => void;
};

export function TargetsCard({
  targets,
  filteredTargets,
  actionLoadingKey,
  onAction,
  onEdit,
  onDelete
}: TargetsCardProps) {
  return (
    <section className="card targets-card">
      <div className="card-header">
        <div>
          <h2>Targets</h2>
          <p className="card-subtitle">Wake, shut down, or reboot devices registered in your Tailnet.</p>
        </div>
        <span className="status-indicator" id="status-indicator">
          {`Total ${targets.length} / Showing ${filteredTargets.length}`}
        </span>
      </div>
      <div className="table-wrapper">
        <table className="targets-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP</th>
              <th>MAC</th>
              <th>Status</th>
              <th>Recent</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTargets.map((target) => {
              const status = target.online === true ? 'online' : target.online === false ? 'offline' : 'unknown';
              const statusLabel = status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Unknown';
              const badgeClass = status === 'online' ? 'badge online' : status === 'offline' ? 'badge offline' : 'badge';
              const mac = target.mac || 'Not set';
              const macClass = target.mac ? '' : 'mac-missing';
              const recent = target.last_wake_at || target.last_status_at || target.updated_at || target.created_at;
              const wakeDisabled = !target.has_mac;
              const wakeKey = `wake:${target.name}`;
              const shutdownKey = `shutdown:${target.name}`;
              const rebootKey = `reboot:${target.name}`;

              return (
                <tr key={target.name}>
                  <td data-label="Name">
                    <div className="target-name">{target.name}</div>
                    {!target.has_mac ? <span className="badge warn">MAC not set</span> : null}
                  </td>
                  <td data-label="IP">{target.ip ?? '-'}</td>
                  <td data-label="MAC" className={macClass}>
                    {mac}
                  </td>
                  <td data-label="Status">
                    <span className={badgeClass}>{statusLabel}</span>
                  </td>
                  <td data-label="Recent">{formatRelative(recent)}</td>
                  <td className="actions" data-label="Actions">
                    <div className="button-group">
                      <button
                        className="btn small"
                        data-action="wake"
                        data-name={target.name}
                        disabled={wakeDisabled}
                        title={wakeDisabled ? 'MAC not set - Wake disabled' : 'Wake on LAN'}
                        data-loading={actionLoadingKey === wakeKey ? 'true' : undefined}
                        onClick={() => onAction(target, 'wake')}
                      >
                        Wake
                      </button>
                      <button
                        className="btn small secondary"
                        data-action="shutdown"
                        data-name={target.name}
                        data-loading={actionLoadingKey === shutdownKey ? 'true' : undefined}
                        onClick={() => onAction(target, 'shutdown')}
                      >
                        Shutdown
                      </button>
                      <button
                        className="btn small secondary"
                        data-action="reboot"
                        data-name={target.name}
                        data-loading={actionLoadingKey === rebootKey ? 'true' : undefined}
                        onClick={() => onAction(target, 'reboot')}
                      >
                        Reboot
                      </button>
                    </div>
                    <div className="button-group secondary">
                      <button className="btn small ghost" onClick={() => onEdit(target)}>
                        Edit
                      </button>
                      <button className="btn small ghost" onClick={() => onDelete(target)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTargets.length === 0 ? (
          <div className="empty-state">No targets yet. Use the “+ Add Target” button to get started.</div>
        ) : null}
      </div>
    </section>
  );
}
