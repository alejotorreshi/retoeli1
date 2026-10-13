import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { relojFijo } from "../../src/infra/reloj.ts";

afterEach(() => {
  setSystemTime();
});

describe("relojFijo separa la fecha de negocio del instante real de la bitácora (IN-03)", () => {
  test("hoy() es la fecha fijada e instanteReal() sigue el reloj del sistema", () => {
    setSystemTime(new Date("2030-01-15T10:20:30.000Z"));
    const reloj = relojFijo("2026-09-03");
    expect(reloj.hoy()).toBe("2026-09-03");
    expect(reloj.instanteReal()).toBe("2030-01-15T10:20:30.000Z");
  });
});
