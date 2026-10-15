import type { RateLimiter, RateLimiterOptions } from "@/http/types/server.type.ts";

type Window = { count: number; readonly start: number };

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, Window>();

  function isExpired(window: Window, now: number): boolean {
    return now - window.start >= options.windowMs;
  }

  function currentWindow(key: string, now: number): Window | undefined {
    const window = windows.get(key);
    if (window === undefined || !isExpired(window, now)) return window;
    windows.delete(key);
    return undefined;
  }

  return {
    hit(key) {
      const now = options.now();
      const window = currentWindow(key, now) ?? { count: 0, start: now };
      window.count += 1;
      windows.set(key, window);
      return window.count <= options.limit;
    },
    isLocked(key) {
      return (currentWindow(key, options.now())?.count ?? 0) >= options.limit;
    },
    trackedKeys() {
      return windows.size;
    },
  };
}
