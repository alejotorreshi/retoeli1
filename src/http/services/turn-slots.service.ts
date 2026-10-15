import type { ObservableTurnSlots, ReleaseSlot } from "@/http/types/server.type.ts";

export function createTurnSlots(max: number): ObservableTurnSlots {
  let taken = 0;

  function singleUseRelease(): ReleaseSlot {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      taken -= 1;
    };
  }

  return {
    tryAcquire() {
      if (taken >= max) return null;
      taken += 1;
      return singleUseRelease();
    },
    inUse() {
      return taken;
    },
  };
}
