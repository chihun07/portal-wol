'use client';

import { useCallback, useState } from 'react';

import type { ToastState, ToastVariant } from '../_lib/types';

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant, active: false }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, active: true } : toast)));
    }, 20);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}
