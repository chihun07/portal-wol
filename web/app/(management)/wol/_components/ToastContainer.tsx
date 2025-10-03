'use client';

import type { ToastState } from '../_lib/types';

type ToastContainerProps = {
  toasts: ToastState[];
};

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.variant}`} data-active={toast.active}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
