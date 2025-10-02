'use client';

import type { FormEventHandler } from 'react';

import type { TargetFormState } from '../_lib/types';

type TargetModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  form: TargetFormState;
  error: string;
  onChange: (form: TargetFormState) => void;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function TargetModal({ open, mode, form, error, onChange, onClose, onSubmit }: TargetModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="target-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="dialog-shell">
        <form id="target-form" onSubmit={onSubmit}>
          <h2 id="target-modal-title">{mode === 'edit' ? 'Edit Target' : 'Add Target'}</h2>
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              required
              minLength={2}
              maxLength={32}
              pattern="[a-z0-9-]+"
              autoComplete="off"
            />
            <small>Use lowercase letters, numbers, and hyphen only (e.g., mainpc).</small>
          </label>
          <label className="field">
            <span>IP address</span>
            <input
              name="ip"
              value={form.ip}
              onChange={(event) => onChange({ ...form, ip: event.target.value })}
              required
              placeholder="192.168.0.10"
              autoComplete="off"
            />
          </label>
          <details className="field advanced" open={Boolean(form.mac)}>
            <summary>Advanced (MAC address)</summary>
            <label>
              <span>MAC address (optional)</span>
              <input
                name="mac"
                value={form.mac}
                onChange={(event) => onChange({ ...form, mac: event.target.value })}
                placeholder="AA:BB:CC:DD:EE:FF"
                autoComplete="off"
              />
            </label>
            <small>If omitted, MAC is learned automatically when the device is online.</small>
          </details>
          <p className="form-error" id="target-form-error">
            {error}
          </p>
          <div className="modal-actions">
            <button type="submit" className="btn primary" id="target-save">
              Save
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
