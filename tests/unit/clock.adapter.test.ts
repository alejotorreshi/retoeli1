import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { clockFromToolEnv, fixedClock, systemClock } from "@/infra/clock/clock.adapter.ts";

afterEach(() => {
  setSystemTime();
});

describe("fixedClock separa la fecha de negocio del instante real de la bitácora (IN-03)", () => {
  test("hoy() es la fecha fijada e instanteReal() sigue el reloj del sistema", () => {
    setSystemTime(new Date("2030-01-15T10:20:30.000Z"));
    const reloj = fixedClock("2026-09-03");
    expect(reloj.hoy()).toBe("2026-09-03");
    expect(reloj.instanteReal()).toBe("2030-01-15T10:20:30.000Z");
  });
});

describe("systemClock arma la fecha por partes, sin depender del formato de un locale (IN-06)", () => {
  test("da la fecha YYYY-MM-DD de la zona pedida", () => {
    setSystemTime(new Date("2026-09-03T03:00:00.000Z"));
    expect(systemClock("America/Bogota").hoy()).toBe("2026-09-02");
    expect(systemClock("Asia/Tokyo").hoy()).toBe("2026-09-03");
  });

  test("conserva los ceros a la izquierda de mes y día", () => {
    setSystemTime(new Date("2027-01-05T12:00:00.000Z"));
    expect(systemClock("America/Bogota").hoy()).toBe("2027-01-05");
  });
});

describe("clockFromToolEnv elige el reloj desde el entorno de las herramientas", () => {
  test("FECHA_EJECUCION fija la fecha y sin ella se usa la zona de negocio", () => {
    setSystemTime(new Date("2026-09-03T03:00:00.000Z"));
    expect(clockFromToolEnv({ FECHA_EJECUCION: "2026-01-02", TZ_NEGOCIO: "America/Bogota" }).hoy()).toBe(
      "2026-01-02",
    );
    expect(clockFromToolEnv({ FECHA_EJECUCION: undefined, TZ_NEGOCIO: "America/Bogota" }).hoy()).toBe(
      "2026-09-02",
    );
    expect(clockFromToolEnv({ FECHA_EJECUCION: undefined, TZ_NEGOCIO: "Asia/Tokyo" }).hoy()).toBe(
      "2026-09-03",
    );
  });
});
