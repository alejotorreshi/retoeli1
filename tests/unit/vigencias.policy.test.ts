import { describe, expect, test } from "bun:test";
import { evaluarVigencia } from "@/domain/policies/vigencias.policy.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";

const HOY: FechaISO = "2026-09-03";
const DIAS_AVISO = 30;

describe("evaluarVigencia (PAQ-05, D-23)", () => {
  test("a 27 días del vencimiento está vigente y avisa 'vence en 27 días'", () => {
    expect(evaluarVigencia("2026-09-30", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 27,
      aviso: "vence en 27 días",
    });
  });

  test("el día siguiente al vencimiento está vencido", () => {
    expect(evaluarVigencia("2026-09-02", HOY, DIAS_AVISO).estado).toBe("vencido");
    expect(evaluarVigencia("2026-08-31", HOY, DIAS_AVISO).estado).toBe("vencido");
    expect(evaluarVigencia("2026-08-31", HOY, DIAS_AVISO).aviso).toBeNull();
  });

  test("el mismo día del vencimiento sigue vigente y avisa 'vence hoy'", () => {
    expect(evaluarVigencia("2026-09-03", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 0,
      aviso: "vence hoy",
    });
  });

  test("a un día del vencimiento avisa en singular", () => {
    expect(evaluarVigencia("2026-09-04", HOY, DIAS_AVISO).aviso).toBe("vence en 1 día");
    expect(evaluarVigencia("2026-09-05", HOY, DIAS_AVISO).aviso).toBe("vence en 2 días");
  });

  test("sin vigencia es vigente y no avisa", () => {
    expect(evaluarVigencia(null, HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: null,
      aviso: null,
    });
  });

  test("a 30 días avisa y a 31 días no", () => {
    expect(evaluarVigencia("2026-10-03", HOY, DIAS_AVISO).aviso).toBe("vence en 30 días");
    expect(evaluarVigencia("2026-10-04", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 31,
      aviso: null,
    });
  });

  test("los días se cuentan exactos a través de un cambio de mes y de año", () => {
    expect(evaluarVigencia("2027-01-01", "2026-12-31", DIAS_AVISO).dias_restantes).toBe(1);
    expect(evaluarVigencia("2026-12-31", HOY, DIAS_AVISO).dias_restantes).toBe(119);
  });
});
