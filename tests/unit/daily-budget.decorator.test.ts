import { describe, expect, test } from "bun:test";
import { crearAdaptadorGuion, exito, falla, opcionesCon } from "@tests/helpers/adaptador-guion.helper.ts";
import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { createDailyBudget, withDailyBudget } from "@/llm/decorators/daily-budget.decorator.ts";
import type { ResultadoEnvio } from "@/llm/types/llm.type.ts";

const HOY = "2026-10-14";
const MANANA = "2026-10-15";
const LIMITE = 1000;

function exitoCon(entrada: number, salida: number): ResultadoEnvio {
  const base = exito();
  if (!base.ok) throw new Error("exito() debe ser ok");
  return { ok: true, respuesta: { ...base.respuesta, uso: { entrada, salida, cacheHit: 0 } } };
}

function abortada(): AbortSignal {
  const control = new AbortController();
  control.abort();
  return control.signal;
}

function calendario(inicial: string) {
  let dia = inicial;
  return {
    today: () => dia,
    avanzar: (siguiente: string) => {
      dia = siguiente;
    },
  };
}

describe("createDailyBudget", () => {
  test("se agota cuando lo usado alcanza el límite, no antes", () => {
    const presupuesto = createDailyBudget({ limit: LIMITE, today: () => HOY });
    presupuesto.record(LIMITE - 1);
    expect(presupuesto.exhausted()).toBe(false);
    presupuesto.record(1);
    expect(presupuesto.exhausted()).toBe(true);
  });

  test("cuando today cambia al día siguiente el contador vuelve a cero", () => {
    const reloj = calendario(HOY);
    const presupuesto = createDailyBudget({ limit: LIMITE, today: reloj.today });
    presupuesto.record(LIMITE);
    expect(presupuesto.exhausted()).toBe(true);
    reloj.avanzar(MANANA);
    expect(presupuesto.exhausted()).toBe(false);
    presupuesto.record(LIMITE - 1);
    expect(presupuesto.exhausted()).toBe(false);
  });
});

describe("withDailyBudget", () => {
  test("con 600 y 600 la segunda llamada pasa y la tercera se rechaza sin llamar a la base", async () => {
    const base = crearAdaptadorGuion([exitoCon(500, 100)]);
    const adaptador = withDailyBudget(base, createDailyBudget({ limit: LIMITE, today: () => HOY }));
    expect((await adaptador.enviar([], [], opcionesCon())).ok).toBe(true);
    expect((await adaptador.enviar([], [], opcionesCon())).ok).toBe(true);
    const rechazo = await adaptador.enviar([], [], opcionesCon());
    expect(rechazo).toEqual({
      ok: false,
      error: { tipo: TIPO_ERROR_LLM.TOPE_DIARIO, reintentable: false, estado: null, reintentarTrasMs: null },
    });
    expect(base.llamadas).toHaveLength(2);
  });

  test("al cambiar el día de negocio la llamada rechazada vuelve a pasar", async () => {
    const reloj = calendario(HOY);
    const base = crearAdaptadorGuion([exitoCon(LIMITE, 0)]);
    const adaptador = withDailyBudget(base, createDailyBudget({ limit: LIMITE, today: reloj.today }));
    await adaptador.enviar([], [], opcionesCon());
    expect((await adaptador.enviar([], [], opcionesCon())).ok).toBe(false);
    reloj.avanzar(MANANA);
    expect((await adaptador.enviar([], [], opcionesCon())).ok).toBe(true);
    expect(base.llamadas).toHaveLength(2);
  });

  test("un resultado de error no suma tokens", async () => {
    const presupuesto = createDailyBudget({ limit: 1, today: () => HOY });
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR), falla(TIPO_ERROR_LLM.SALDO)]);
    const adaptador = withDailyBudget(base, presupuesto);
    await adaptador.enviar([], [], opcionesCon());
    await adaptador.enviar([], [], opcionesCon());
    expect(presupuesto.exhausted()).toBe(false);
    expect(base.llamadas).toHaveLength(2);
  });

  test("una llamada abortada no suma tokens", async () => {
    const presupuesto = createDailyBudget({ limit: 1, today: () => HOY });
    const adaptador = withDailyBudget(crearAdaptadorGuion([falla(TIPO_ERROR_LLM.ABORTADO)]), presupuesto);
    const resultado = await adaptador.enviar([], [], opcionesCon(abortada()));
    expect(resultado.ok).toBe(false);
    expect(presupuesto.exhausted()).toBe(false);
  });
});
