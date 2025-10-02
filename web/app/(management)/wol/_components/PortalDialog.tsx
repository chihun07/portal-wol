'use client';

type PortalDialogProps = {
  open: boolean;
  src: string;
  onClose: () => void;
};

export function PortalDialog({ open, src, onClose }: PortalDialogProps) {
  if (!open) {
    return null;
  }

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
          <h2 id="portal-dialog-title">Monitoring Portal</h2>
          <button type="button" className="portal-dialog__close" onClick={onClose}>
            Close
          </button>
        </header>
        <iframe className="portal-dialog__iframe" src={src} title="Monitoring portal" loading="lazy" />
      </div>
    </div>
  );
}
