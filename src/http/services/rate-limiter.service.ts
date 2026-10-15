import type { RateLimiter, RateLimiterOptions } from "@/http/types/server.type.ts";

type Window = { count: number; readonly start: number };

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, Window>();

  function sweep(now: number): void {
    for (const [key, window] of windows) {
      if (now - window.start >= options.windowMs) windows.delete(key);
    }
  }

  function countOf(key: string): number {
    return windows.get(key)?.count ?? 0;
  }

  return {
    hit(key) {
      const now = options.now();
      sweep(now);
      const window = windows.get(key) ?? { count: 0, start: now };
      window.count += 1;
      windows.set(key, window);
      return window.count <= options.limit;
    },
    isLocked(key) {
      sweep(options.now());
      return countOf(key) >= options.limit;
    },
    trackedKeys() {
      return windows.size;
    },
  };
}
