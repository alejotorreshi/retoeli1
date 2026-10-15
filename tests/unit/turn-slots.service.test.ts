import { describe, expect, test } from "bun:test";
import { createTurnSlots } from "@/http/services/turn-slots.service.ts";
import type { ObservableTurnSlots, ReleaseSlot } from "@/http/types/server.type.ts";

const CUPOS = 3;

function adquirir(cupos: ObservableTurnSlots, veces: number): (ReleaseSlot | null)[] {
  return Array.from({ length: veces }, () => cupos.tryAcquire());
}

function pasaron(liberaciones: readonly (ReleaseSlot | null)[]): boolean[] {
  return liberaciones.map((liberar) => liberar !== null);
}

describe("createTurnSlots", () => {
  test("con 3 cupos tres adquisiciones pasan y la cuarta no", () => {
    const cupos = createTurnSlots(CUPOS);
    expect(pasaron(adquirir(cupos, CUPOS + 1))).toEqual([true, true, true, false]);
    expect(cupos.inUse()).toBe(CUPOS);
  });

  test("liberar un cupo deja pasar exactamente una adquisición más", () => {
    const cupos = createTurnSlots(CUPOS);
    const [liberar] = adquirir(cupos, CUPOS);
    liberar?.();
    expect(cupos.inUse()).toBe(CUPOS - 1);
    expect(pasaron(adquirir(cupos, 2))).toEqual([true, false]);
  });

  test("una liberación es de un solo uso: repetirla no libera otro cupo ni agrega capacidad", () => {
    const cupos = createTurnSlots(CUPOS);
    const [primera] = adquirir(cupos, CUPOS);
    for (let vez = 0; vez < CUPOS * 2; vez += 1) primera?.();
    expect(cupos.inUse()).toBe(CUPOS - 1);
    expect(pasaron(adquirir(cupos, 2))).toEqual([true, false]);
  });

  test("un solo cupo alterna entre ocupado y libre", () => {
    const cupos = createTurnSlots(1);
    const liberar = cupos.tryAcquire();
    expect(liberar).not.toBeNull();
    expect(cupos.tryAcquire()).toBeNull();
    liberar?.();
    expect(cupos.tryAcquire()).not.toBeNull();
  });
});
