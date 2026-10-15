import type { TurnSlots } from "@/http/types/server.type.ts";

export function createTurnSlots(max: number): TurnSlots {
  let taken = 0;
  return {
    tryAcquire() {
      if (taken >= max) return false;
      taken += 1;
      return true;
    },
    release() {
      taken = Math.max(0, taken - 1);
    },
    inUse() {
      return taken;
    },
  };
}
