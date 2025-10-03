'use client';

import { useLanguage } from '../../../_i18n/LanguageProvider';

type PortalDialogProps = {
  open: boolean;
  src: string;
  onClose: () => void;
};

export function PortalDialog({ open, src, onClose }: PortalDialogProps) {
  const { t } = useLanguage();

  if (!open) {
    return null;
  }

  const title = t('monitoring.dialogTitle');
  const closeLabel = t('monitoring.dialogClose');
  const iframeTitle = t('monitoring.dialogFrameTitle');

  return (
    <div
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="portal-dialog-shell">
        <header className="portal-dialog__header">
          <h2 id="portal-dialog-title">{title}</h2>
          <button type="button" className="btn secondary portal-dialog__close" onClick={onClose}>
            {closeLabel}
          </button>
        </header>
        <iframe className="portal-dialog__iframe" src={src} title={iframeTitle} loading="lazy" />
      </div>
    </div>
  );
}
