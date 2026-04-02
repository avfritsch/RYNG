import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'ryng_install_dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

interface InstallStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  dismissed: boolean;
  setPrompt: (e: BeforeInstallPromptEvent) => void;
  install: () => Promise<void>;
  dismiss: () => void;
}

export const useInstallStore = create<InstallStore>((set, get) => ({
  deferredPrompt: null,
  canInstall: false,
  dismissed: isDismissed(),

  setPrompt: (e) => set({ deferredPrompt: e, canInstall: true }),

  install: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    set({ deferredPrompt: null, canInstall: false });
  },

  dismiss: () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    set({ dismissed: true });
  },
}));
