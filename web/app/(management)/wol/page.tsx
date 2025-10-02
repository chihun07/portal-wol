'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBodyClass } from '../../_hooks/useBodyClass';
import { useTheme } from '../../_hooks/useTheme';
import { ConfirmDeleteModal } from './_components/ConfirmDeleteModal';
import { LogsCard } from './_components/LogsCard';
import { PortalDialog } from './_components/PortalDialog';
import { PortalBanner, WolHeader } from './_components/WolHeader';
import { TargetModal } from './_components/TargetModal';
import { TargetsCard } from './_components/TargetsCard';
import { ToastContainer } from './_components/ToastContainer';
import { useToastQueue } from './_hooks/useToastQueue';
import { ACTION_CONFIG, ACTION_LABELS, PORTAL_URL } from './_lib/constants';
import { request } from './_lib/api';
import type {
  LogEntry,
  PowerAction,
  RequestError,
  Target,
  TargetFormState,
  TargetsResponse
} from './_lib/types';

type RequestOptions = { silent?: boolean };

type StatusOptions = { log?: boolean };

const ACTION_LOG_LIMIT = 120;

export default function WolPage() {
  useBodyClass('wol-body');

  const { theme, toggleTheme, ready } = useTheme();
  const { toasts, showToast } = useToastQueue();

  const [targets, setTargets] = useState<Target[]>([]);
  const targetsRef = useRef<Target[]>([]);
  const [filter, setFilter] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetModalMode, setTargetModalMode] = useState<'create' | 'edit'>('create');
  const [targetForm, setTargetForm] = useState<TargetFormState>({ name: '', ip: '', mac: '' });
  const [targetError, setTargetError] = useState('');
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Target | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const loadingTargetsRef = useRef(false);
  const statusRefreshingRef = useRef(false);

  const appendLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, ACTION_LOG_LIMIT));
  }, []);

  const updateLog = useCallback((id: string, patch: Partial<LogEntry>) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...patch } : log)));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  const loadTargets = useCallback(async ({ silent = false }: RequestOptions = {}) => {
    if (loadingTargetsRef.current) return;
    loadingTargetsRef.current = true;
    try {
      const data = await request<TargetsResponse>('api/targets');
      const list = Array.isArray(data?.targets) ? data.targets : [];
      setTargets(list);
      if (!silent) {
        showToast('Targets loaded.', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load targets.', 'error');
    } finally {
      loadingTargetsRef.current = false;
    }
  }, [showToast]);

  const refreshStatuses = useCallback(async ({ log = false }: StatusOptions = {}) => {
    if (statusRefreshingRef.current || !targetsRef.current.length) {
      return;
    }
    statusRefreshingRef.current = true;
    const silentParam = log ? 'false' : 'true';
    try {
      for (const target of targetsRef.current) {
        try {
          await request(`api/status?target=${encodeURIComponent(target.name)}&silent=${silentParam}`);
        } catch (error) {
          console.warn('status error', target.name, error);
        }
      }
      await loadTargets({ silent: true });
      if (log) {
        showToast('Statuses refreshed.', 'success');
      }
    } finally {
      statusRefreshingRef.current = false;
    }
  }, [loadTargets, showToast]);

  useEffect(() => {
    loadTargets({ silent: true });
  }, [loadTargets]);

  useEffect(() => {
    if (!targets.length) {
      return;
    }
    const interval = window.setInterval(() => {
      refreshStatuses({ log: false });
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [targets.length, refreshStatuses]);

  const filteredTargets = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return targets;
    return targets.filter((target) => {
      const nameMatch = target.name.toLowerCase().includes(term);
      const ipMatch = (target.ip ?? '').toLowerCase().includes(term);
      return nameMatch || ipMatch;
    });
  }, [filter, targets]);

  useEffect(() => {
    if (portalOpen) {
      document.body.classList.add('wol-portal-open');
    } else {
      document.body.classList.remove('wol-portal-open');
    }
  }, [portalOpen]);

  const closeTargetModal = useCallback(() => {
    setTargetModalOpen(false);
    setEditingTarget(null);
  }, []);

  const openCreateModal = useCallback(() => {
    setTargetModalMode('create');
    setTargetForm({ name: '', ip: '', mac: '' });
    setTargetError('');
    setEditingTarget(null);
    setTargetModalOpen(true);
  }, []);

  const openEditModal = useCallback((target: Target) => {
    setTargetModalMode('edit');
    setEditingTarget(target);
    setTargetForm({ name: target.name ?? '', ip: target.ip ?? '', mac: target.mac ?? '' });
    setTargetError('');
    setTargetModalOpen(true);
  }, []);

  const openConfirmModal = useCallback((target: Target) => {
    setConfirmTarget(target);
  }, []);

  const closePortal = useCallback(() => setPortalOpen(false), []);

  useEffect(() => {
    setTargetError('');
  }, [targetModalOpen]);

  const handleTargetSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const name = targetForm.name.trim();
      const ip = targetForm.ip.trim();
      const mac = targetForm.mac.trim();
      if (!name || !ip) {
        setTargetError('Please enter both name and IP.');
        return;
      }
      const payload: Record<string, string> = { name, ip };
      if (mac || targetModalMode === 'edit') {
        payload.mac = mac;
      }
      try {
        if (targetModalMode === 'edit' && editingTarget) {
          await request(`api/targets/${encodeURIComponent(editingTarget.name)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          showToast('Updated target.', 'success');
        } else {
          await request('api/targets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          showToast('Added target.', 'success');
        }
        closeTargetModal();
        setEditingTarget(null);
        setTargetError('');
        setTargetForm({ name: '', ip: '', mac: '' });
        await loadTargets({ silent: true });
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
                : 'Failed to save.';
        setTargetError(message);
      }
    },
    [closeTargetModal, editingTarget, loadTargets, showToast, targetForm, targetModalMode]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmTarget) {
      return;
    }
    try {
      await request(`api/targets/${encodeURIComponent(confirmTarget.name)}`, { method: 'DELETE' });
      showToast('Deleted target.', 'success');
      await loadTargets({ silent: true });
    } catch (error) {
      console.error(error);
      showToast('Failed to delete target.', 'error');
    } finally {
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadTargets, showToast]);

  const handleAction = useCallback(
    async (target: Target, action: PowerAction) => {
      if (action === 'wake' && !target.has_mac) {
        showToast('Cannot wake without a MAC address.', 'warning');
        return;
      }
      const config = ACTION_CONFIG[action];
      const key = `${action}:${target.name}`;
      const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setActionLoadingKey(key);
      appendLog({
        id: logId,
        timestamp: new Date().toISOString(),
        action,
        target: target.name,
        status: 'pending',
        message: `Sending ${ACTION_LABELS[action]} command to ${target.name}…`
      });
      try {
        await request(config.path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target: target.name })
        });
        updateLog(logId, {
          status: 'success',
          message: config.success(target.name)
        });
        showToast(config.success(target.name), 'success');
        await loadTargets({ silent: true });
      } catch (error) {
        console.error(error);
        const payload = (error as RequestError)?.payload as { detail?: unknown } | string | undefined;
        const detail =
          typeof payload === 'string'
            ? payload
            : typeof payload?.detail === 'string'
              ? payload.detail
              : typeof payload?.detail === 'object' && payload?.detail !== null && 'error' in (payload.detail as Record<string, unknown>)
                ? String((payload.detail as Record<string, unknown>).error)
                : undefined;
        const message = detail || config.failure;
        updateLog(logId, {
          status: 'error',
          message
        });
        showToast(message, 'error');
      } finally {
        setActionLoadingKey(null);
      }
    },
    [appendLog, loadTargets, showToast, updateLog]
  );

  return (
    <div className="page-shell">
      <WolHeader
        filter={filter}
        onFilterChange={(event) => setFilter(event.target.value)}
        onRefreshStatus={() => refreshStatuses({ log: true })}
        onOpenPortal={() => setPortalOpen(true)}
        onToggleTheme={toggleTheme}
        onAddTarget={openCreateModal}
        theme={theme}
        themeReady={ready}
      />

      <main className="layout">
        <PortalBanner />
        <TargetsCard
          targets={targets}
          filteredTargets={filteredTargets}
          actionLoadingKey={actionLoadingKey}
          onAction={handleAction}
          onEdit={openEditModal}
          onDelete={openConfirmModal}
        />
        <LogsCard logs={logs} onClear={clearLogs} />
      </main>

      <ToastContainer toasts={toasts} />

      <TargetModal
        open={targetModalOpen}
        mode={targetModalMode}
        form={targetForm}
        error={targetError}
        onChange={setTargetForm}
        onClose={closeTargetModal}
        onSubmit={handleTargetSubmit}
      />

      <ConfirmDeleteModal target={confirmTarget} onConfirm={handleDelete} onCancel={() => setConfirmTarget(null)} />

      <PortalDialog open={portalOpen} src={PORTAL_URL} onClose={closePortal} />
    </div>
  );
}
