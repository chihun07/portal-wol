'use client';

import type { Target } from '../_lib/types';
import { useLanguage } from '../../../_i18n/LanguageProvider';

type ConfirmDeleteModalProps = {
  target: Target | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({ target, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const { t } = useLanguage();

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
        <h2 id="confirm-modal-title">{t('wol.confirmDelete.title')}</h2>
        <p>{t('wol.confirmDelete.message', { name: target.name })}</p>
        <div className="modal-actions">
          <button type="button" className="btn danger" onClick={onConfirm}>
            {t('wol.confirmDelete.delete')}
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            {t('wol.confirmDelete.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
