'use client';

import type { Target } from '../_lib/types';

type ConfirmDeleteModalProps = {
  target: Target | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({ target, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  if (!target) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="dialog-shell">
        <h2 id="confirm-modal-title">Confirm Delete</h2>
        <p>Delete target {target.name}?</p>
        <div className="modal-actions">
          <button type="button" className="btn danger" onClick={onConfirm}>
            Delete
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
