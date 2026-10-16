import { RESULTADO_RESERVA } from "@/config/constants/http.constants.ts";
import type { ObservableRateLimiter, RateLimiterOptions, Reservation } from "@/http/types/server.type.ts";

type Window = { count: number; pending: number; readonly start: number };

export function createRateLimiter(options: RateLimiterOptions): ObservableRateLimiter {
  const windows = new Map<string, Window>();

  function hasExpired(window: Window, now: number): boolean {
    return now - window.start >= options.windowMs;
  }

  function sweep(now: number): void {
    for (const [key, window] of windows) {
      if (!hasExpired(window, now)) return;
      windows.delete(key);
    }
  }

  function attempts(window: Window): number {
    return window.count + window.pending;
  }

  function isFull(): boolean {
    return windows.size >= options.maxKeys;
  }

  function oldestUnlocked(): [string, Window] | undefined {
    for (const entry of windows) {
      if (attempts(entry[1]) < options.limit) return entry;
    }
    return undefined;
  }

  function evictOldestUnlocked(): number | null {
    const entry = oldestUnlocked();
    if (entry === undefined) return null;
    windows.delete(entry[0]);
    return attempts(entry[1]);
  }

  function admit(now: number): Window | null {
    if (!isFull()) return { count: 0, pending: 0, start: now };
    const inherited = evictOldestUnlocked();
    if (inherited === null) return null;
    return { count: inherited, pending: 0, start: now };
  }

  function isSaturated(): boolean {
    return isFull() && oldestUnlocked() === undefined;
  }

  function lockedNow(key: string): boolean {
    const window = windows.get(key);
    if (window === undefined) return isSaturated();
    return window.count >= options.limit;
  }

  function claim(key: string, now: number): Window | null {
    sweep(now);
    const window = windows.get(key) ?? admit(now);
    if (window === null || attempts(window) >= options.limit) return null;
    windows.set(key, window);
    return window;
  }

  function settle(key: string, failed: boolean): void {
    sweep(options.now());
    const window = windows.get(key);
    if (window === undefined || window.pending === 0) return;
    window.pending -= 1;
    if (failed) window.count += 1;
    if (attempts(window) === 0) windows.delete(key);
  }

  function msUntilExpiry(window: Window, now: number): number {
    return Math.max(0, window.start + options.windowMs - now);
  }

  function msUntilAdmission(now: number): number {
    if (!isSaturated()) return 0;
    const oldest = windows.values().next();
    if (oldest.done) return 0;
    return msUntilExpiry(oldest.value, now);
  }

  return {
    hit(key) {
      const window = claim(key, options.now());
      if (window === null) return false;
      window.count += 1;
      return true;
    },
    reserve(key): Reservation {
      const window = claim(key, options.now());
      if (window !== null) {
        window.pending += 1;
        return RESULTADO_RESERVA.RESERVADO;
      }
      return lockedNow(key) ? RESULTADO_RESERVA.BLOQUEADO : RESULTADO_RESERVA.OCUPADO;
    },
    release(key) {
      settle(key, false);
    },
    confirmFailure(key) {
      settle(key, true);
    },
    isLocked(key) {
      sweep(options.now());
      return lockedNow(key);
    },
    retryAfterMs(key) {
      const now = options.now();
      sweep(now);
      const window = windows.get(key);
      if (window === undefined) return msUntilAdmission(now);
      if (window.count < options.limit) return 0;
      return msUntilExpiry(window, now);
    },
    trackedKeys() {
      return windows.size;
    },
  };
}
