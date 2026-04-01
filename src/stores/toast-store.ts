import { create } from 'zustand';
import { TOAST_DURATION_MS } from '../lib/constants.ts';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: Toast['type'], onUndo?: () => void) => void;
  dismiss: (id: string) => void;
}

const UNDO_DURATION_MS = 5000;

/** Maps toast id -> setTimeout handle so we can clear on early dismiss */
const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  show: (message, type = 'success', onUndo) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type, onUndo }] }));

    const duration = onUndo ? UNDO_DURATION_MS : TOAST_DURATION_MS;
    const handle = setTimeout(() => {
      timeoutMap.delete(id);
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
    timeoutMap.set(id, handle);
  },

  dismiss: (id) => {
    const handle = timeoutMap.get(id);
    if (handle) {
      clearTimeout(handle);
      timeoutMap.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Shorthand for showing a toast from anywhere */
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error: (msg: string) => useToastStore.getState().show(msg, 'error'),
  info: (msg: string) => useToastStore.getState().show(msg, 'info'),
  undo: (msg: string, onUndo: () => void) => useToastStore.getState().show(msg, 'info', onUndo),
};
