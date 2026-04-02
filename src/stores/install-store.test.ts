import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { BeforeInstallPromptEvent } from './install-store';

// We need to reset the zustand store between tests, so we re-import each time.
// Clear module cache before each test so the store re-evaluates isDismissed().
describe('useInstallStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getStore() {
    const mod = await import('./install-store');
    return mod.useInstallStore;
  }

  it('has correct initial state when nothing is in localStorage', async () => {
    const useInstallStore = await getStore();
    const state = useInstallStore.getState();

    expect(state.canInstall).toBe(false);
    expect(state.dismissed).toBe(false);
    expect(state.deferredPrompt).toBeNull();
  });

  it('setPrompt sets canInstall to true and stores the event', async () => {
    const useInstallStore = await getStore();
    const fakeEvent = { type: 'beforeinstallprompt' } as BeforeInstallPromptEvent;

    useInstallStore.getState().setPrompt(fakeEvent);

    const state = useInstallStore.getState();
    expect(state.canInstall).toBe(true);
    expect(state.deferredPrompt).toBe(fakeEvent);
  });

  it('dismiss sets dismissed to true and writes timestamp to localStorage', async () => {
    const useInstallStore = await getStore();

    useInstallStore.getState().dismiss();

    const state = useInstallStore.getState();
    expect(state.dismissed).toBe(true);

    const raw = localStorage.getItem('ryng_install_dismissed');
    expect(raw).not.toBeNull();
    const ts = Number(raw);
    expect(Number.isNaN(ts)).toBe(false);
    // Timestamp should be very close to now
    expect(Math.abs(Date.now() - ts)).toBeLessThan(2000);
  });

  it('reads dismissed=true from localStorage when within 7 days', async () => {
    // Set a recent dismiss timestamp
    localStorage.setItem('ryng_install_dismissed', String(Date.now() - 1000));

    const useInstallStore = await getStore();
    expect(useInstallStore.getState().dismissed).toBe(true);
  });

  it('reads dismissed=false when dismiss timestamp is older than 7 days', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem('ryng_install_dismissed', String(eightDaysAgo));

    const useInstallStore = await getStore();
    expect(useInstallStore.getState().dismissed).toBe(false);
  });

  it('reads dismissed=false when localStorage value is not a number', async () => {
    localStorage.setItem('ryng_install_dismissed', 'garbage');

    const useInstallStore = await getStore();
    expect(useInstallStore.getState().dismissed).toBe(false);
  });

  it('install calls prompt() and userChoice on the deferred event', async () => {
    const useInstallStore = await getStore();

    const fakeEvent = {
      type: 'beforeinstallprompt',
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    } as unknown as BeforeInstallPromptEvent;

    useInstallStore.getState().setPrompt(fakeEvent);
    await useInstallStore.getState().install();

    expect(fakeEvent.prompt).toHaveBeenCalled();
    const state = useInstallStore.getState();
    expect(state.canInstall).toBe(false);
    expect(state.deferredPrompt).toBeNull();
  });

  it('install does nothing when there is no deferred prompt', async () => {
    const useInstallStore = await getStore();
    // Should not throw
    await useInstallStore.getState().install();
    expect(useInstallStore.getState().canInstall).toBe(false);
  });
});
