import type { ObservableRateLimiter, RateLimiterOptions } from "@/http/types/server.type.ts";

type Window = { count: number; readonly start: number };

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

  function isFull(): boolean {
    return windows.size >= options.maxKeys;
  }

  function oldestUnlocked(): [string, Window] | undefined {
    for (const entry of windows) {
      if (entry[1].count < options.limit) return entry;
    }
    return undefined;
  }

  function evictOldestUnlocked(): number | null {
    const entry = oldestUnlocked();
    if (entry === undefined) return null;
    windows.delete(entry[0]);
    return entry[1].count;
  }

  function admit(now: number): Window | null {
    if (!isFull()) return { count: 0, start: now };
    const inherited = evictOldestUnlocked();
    if (inherited === null) return null;
    return { count: inherited, start: now };
  }

  function isSaturated(): boolean {
    return isFull() && oldestUnlocked() === undefined;
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
      const now = options.now();
      sweep(now);
      const window = windows.get(key) ?? admit(now);
      if (window === null) return false;
      window.count += 1;
      windows.set(key, window);
      return window.count <= options.limit;
    },
    isLocked(key) {
      sweep(options.now());
      const window = windows.get(key);
      if (window === undefined) return isSaturated();
      return window.count >= options.limit;
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
