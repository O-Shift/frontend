import { useState, useEffect } from 'react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  ref?: string;
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  count: number;
  timestamp: number;
  duration: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private maxToasts = 4;
  private dedupeWindowMs = 3000;

  private fingerprint(opts: ToastOptions): string {
    return `${opts.type || 'info'}:${opts.title || ''}:${opts.message}:${opts.ref || ''}`;
  }

  public getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  public show(opts: ToastOptions): string {
    const now = Date.now();
    const fp = opts.id || this.fingerprint(opts);
    const existingIdx = this.toasts.findIndex(
      (t) => (t.id === fp || this.fingerprint(t) === this.fingerprint(opts)) && now - t.timestamp < this.dedupeWindowMs
    );

    if (existingIdx !== -1) {
      // Deduplicate: increment burst count and refresh timestamp
      const updated = [...this.toasts];
      const prev = updated[existingIdx];
      updated[existingIdx] = {
        ...prev,
        count: prev.count + 1,
        timestamp: now,
      };
      this.toasts = updated;
      this.notify();
      return prev.id;
    }

    const newToast: ToastItem = {
      id: opts.id || `toast-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message,
      ref: opts.ref,
      duration: opts.duration ?? 4500,
      action: opts.action,
      count: 1,
      timestamp: now,
    };

    this.toasts = [newToast, ...this.toasts].slice(0, this.maxToasts);
    this.notify();
    return newToast.id;
  }

  public dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clear(): void {
    this.toasts = [];
    this.notify();
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = [...this.toasts];
    for (const listener of this.listeners) {
      listener(copy);
    }
  }
}

export const toastManager = new ToastManager();

export const toast = {
  error: (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): string =>
    toastManager.show({ ...opts, message, type: 'error' }),
  success: (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): string =>
    toastManager.show({ ...opts, message, type: 'success' }),
  warning: (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): string =>
    toastManager.show({ ...opts, message, type: 'warning' }),
  info: (message: string, opts?: Omit<ToastOptions, 'message' | 'type'>): string =>
    toastManager.show({ ...opts, message, type: 'info' }),
  dismiss: (id: string): void => toastManager.dismiss(id),
  clear: (): void => toastManager.clear(),
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(() => toastManager.getToasts());

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return {
    toasts,
    toast,
    dismiss: toast.dismiss,
  };
}
