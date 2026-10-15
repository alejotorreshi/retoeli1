import { describe, expect, test } from "bun:test";
import { createTurnSlots } from "@/http/services/turn-slots.service.ts";
import type { TurnSlots } from "@/http/types/server.type.ts";

const CUPOS = 3;

function adquirir(cupos: TurnSlots, veces: number): boolean[] {
  return Array.from({ length: veces }, () => cupos.tryAcquire());
}

describe("createTurnSlots", () => {
  test("con 3 cupos tres adquisiciones pasan y la cuarta no", () => {
    const cupos = createTurnSlots(CUPOS);
    expect(adquirir(cupos, CUPOS + 1)).toEqual([true, true, true, false]);
    expect(cupos.inUse()).toBe(CUPOS);
  });

  test("liberar un cupo deja pasar exactamente una adquisición más", () => {
    const cupos = createTurnSlots(CUPOS);
    adquirir(cupos, CUPOS);
    cupos.release();
    expect(cupos.inUse()).toBe(CUPOS - 1);
    expect(adquirir(cupos, 2)).toEqual([true, false]);
  });

  test("liberar de más nunca baja de cero ni agrega capacidad", () => {
    const cupos = createTurnSlots(CUPOS);
    cupos.tryAcquire();
    for (let vez = 0; vez < CUPOS * 2; vez += 1) cupos.release();
    expect(cupos.inUse()).toBe(0);
    expect(adquirir(cupos, CUPOS + 1)).toEqual([true, true, true, false]);
  });

  test("un solo cupo alterna entre ocupado y libre", () => {
    const cupos = createTurnSlots(1);
    expect(cupos.tryAcquire()).toBe(true);
    expect(cupos.tryAcquire()).toBe(false);
    cupos.release();
    expect(cupos.tryAcquire()).toBe(true);
  });
});
