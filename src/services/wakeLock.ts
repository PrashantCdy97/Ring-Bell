/**
 * Screen Wake Lock Service for Windows & Desktop PCs
 * Keeps the screen and audio active so scheduled school bells ring reliably
 * without Windows Sleep or Power Saving interrupting the system.
 */

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
};

class WakeLockService {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested = false;
  private isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequested) {
          this.acquire();
        }
      });
    }
  }

  public isWakeLockSupported(): boolean {
    return this.isSupported;
  }

  public isActive(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }

  public async acquire(): Promise<boolean> {
    this.isRequested = true;
    if (!this.isSupported) return false;

    try {
      const nav = navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } };
      this.sentinel = await nav.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('WakeLock acquisition failed or unsupported:', err);
      return false;
    }
  }

  public async release(): Promise<void> {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // ignore
      }
      this.sentinel = null;
    }
  }
}

export const wakeLockService = new WakeLockService();
