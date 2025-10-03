'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBodyClass } from '../../_hooks/useBodyClass';
import { useTheme } from '../../_hooks/useTheme';
import { useLanguage } from '../../_i18n/LanguageProvider';
import { ConfirmDeleteModal } from './_components/ConfirmDeleteModal';
import { LogsCard } from './_components/LogsCard';
import { PortalDialog } from './_components/PortalDialog';
import { PortalBanner, WolHeader } from './_components/WolHeader';
import { TargetModal } from './_components/TargetModal';
import { TargetsCard } from './_components/TargetsCard';
import { ToastContainer } from './_components/ToastContainer';
import { useToastQueue } from './_hooks/useToastQueue';
import { ACTION_ENDPOINTS, PORTAL_URL } from './_lib/constants';
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

  useTheme();
  const { t } = useLanguage();
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
        showToast(t('wol.toasts.targetsLoaded'), 'success');
      }
    } catch (error) {
      console.error(error);
      showToast(t('wol.toasts.targetsLoadFailed'), 'error');
    } finally {
      loadingTargetsRef.current = false;
    }
  }, [showToast, t]);

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
        showToast(t('wol.toasts.statusesRefreshed'), 'success');
      }
    } finally {
      statusRefreshingRef.current = false;
    }
  }, [loadTargets, showToast, t]);

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
        const message = t('wol.toasts.missingFields');
        setTargetError(message);
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
          showToast(t('wol.toasts.targetUpdated'), 'success');
        } else {
          await request('api/targets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          showToast(t('wol.toasts.targetAdded'), 'success');
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
                : t('wol.toasts.saveFailed');
        setTargetError(message);
      }
    },
    [closeTargetModal, editingTarget, loadTargets, showToast, t, targetForm, targetModalMode]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmTarget) {
      return;
    }
    try {
      await request(`api/targets/${encodeURIComponent(confirmTarget.name)}`, { method: 'DELETE' });
      showToast(t('wol.toasts.targetDeleted'), 'success');
      await loadTargets({ silent: true });
    } catch (error) {
      console.error(error);
      showToast(t('wol.toasts.deleteFailed'), 'error');
    } finally {
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadTargets, showToast, t]);

  const handleAction = useCallback(
    async (target: Target, action: PowerAction) => {
      if (action === 'wake' && !target.has_mac) {
        showToast(t('wol.toasts.macRequired'), 'warning');
        return;
      }
      const path = ACTION_ENDPOINTS[action];
      if (!path) {
        return;
      }
      const key = `${action}:${target.name}`;
      const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const actionLabel = t(`wol.actions.labels.${action}`);
      setActionLoadingKey(key);
      appendLog({
        id: logId,
        timestamp: new Date().toISOString(),
        action,
        target: target.name,
        status: 'pending',
        message: t('wol.actions.progress', { action: actionLabel, target: target.name })
      });
      try {
        await request(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ target: target.name })
        });
        const successMessage = t('wol.actions.success', { action: actionLabel, target: target.name });
        updateLog(logId, {
          status: 'success',
          message: successMessage
        });
        showToast(successMessage, 'success');
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
        const failureMessage = t('wol.actions.failure', { action: actionLabel });
        const message = detail || failureMessage;
        updateLog(logId, {
          status: 'error',
          message
        });
        showToast(message, 'error');
      } finally {
        setActionLoadingKey(null);
      }
    },
    [appendLog, loadTargets, showToast, t, updateLog]
  );

  return (
    <div className="page-shell">
      <WolHeader
        filter={filter}
        onFilterChange={(event) => setFilter(event.target.value)}
        onRefreshStatus={() => refreshStatuses({ log: true })}
        onOpenPortal={() => setPortalOpen(true)}
        onAddTarget={openCreateModal}
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
