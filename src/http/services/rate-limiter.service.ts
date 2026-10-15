import type { ObservableRateLimiter, RateLimiterOptions } from "@/http/types/server.type.ts";

type Window = { count: number; readonly start: number };

export function createRateLimiter(options: RateLimiterOptions): ObservableRateLimiter {
  const windows = new Map<string, Window>();
  let evicted: Window | undefined;

  function hasExpired(window: Window, now: number): boolean {
    return now - window.start >= options.windowMs;
  }

  function sweep(now: number): void {
    if (evicted !== undefined && hasExpired(evicted, now)) evicted = undefined;
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

  function fitsEvictionBudget(window: Window): boolean {
    return (evicted?.count ?? 0) + window.count <= options.limit;
  }

  function evictableEntry(): [string, Window] | undefined {
    const entry = oldestUnlocked();
    return entry !== undefined && fitsEvictionBudget(entry[1]) ? entry : undefined;
  }

  function evictOldestUnlocked(now: number): boolean {
    const entry = evictableEntry();
    if (entry === undefined) return false;
    const [key, window] = entry;
    windows.delete(key);
    evicted = { count: (evicted?.count ?? 0) + window.count, start: evicted?.start ?? now };
    return true;
  }

  function isSaturated(): boolean {
    return isFull() && evictableEntry() === undefined;
  }

  function msUntilExpiry(window: Window, now: number): number {
    return Math.max(0, window.start + options.windowMs - now);
  }

  function msUntilAdmission(now: number): number {
    if (!isSaturated()) return 0;
    const oldest = windows.values().next();
    if (oldest.done) return 0;
    const untilOldestExpires = msUntilExpiry(oldest.value, now);
    if (evicted === undefined || oldestUnlocked() === undefined) return untilOldestExpires;
    return Math.min(untilOldestExpires, msUntilExpiry(evicted, now));
  }

  return {
    hit(key) {
      const now = options.now();
      sweep(now);
      const existing = windows.get(key);
      if (existing === undefined && isFull() && !evictOldestUnlocked(now)) return false;
      const window = existing ?? { count: 0, start: now };
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
