import type { ObservableRateLimiter, RateLimiterOptions } from "@/http/types/server.type.ts";

type Window = { count: number; readonly start: number };

export function createRateLimiter(options: RateLimiterOptions): ObservableRateLimiter {
  const windows = new Map<string, Window>();

  function sweep(now: number): void {
    for (const [key, window] of windows) {
      if (now - window.start < options.windowMs) return;
      windows.delete(key);
    }
  }

  function evictOldest(): void {
    const oldest = windows.keys().next();
    if (!oldest.done) windows.delete(oldest.value);
  }

  function countOf(key: string): number {
    return windows.get(key)?.count ?? 0;
  }

  return {
    hit(key) {
      const now = options.now();
      sweep(now);
      const existing = windows.get(key);
      if (existing === undefined && windows.size >= options.maxKeys) evictOldest();
      const window = existing ?? { count: 0, start: now };
      window.count += 1;
      windows.set(key, window);
      return window.count <= options.limit;
    },
    isLocked(key) {
      sweep(options.now());
      return countOf(key) >= options.limit;
    },
    retryAfterMs(key) {
      const now = options.now();
      sweep(now);
      const window = windows.get(key);
      if (window === undefined || window.count < options.limit) return 0;
      return Math.max(0, window.start + options.windowMs - now);
    },
    trackedKeys() {
      return windows.size;
    },
  };
}
