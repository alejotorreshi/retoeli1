import { describe, expect, test } from "bun:test";
import {
  crearAdaptadorGuion,
  exito,
  falla,
  MODELO_PRIMARIO,
  opcionesCon,
  PROVEEDOR_PRIMARIO,
} from "@tests/helpers/adaptador-guion.helper.ts";
import type { PasoGuion } from "@tests/helpers/types/adaptador-guion.type.ts";
import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { withTimeout } from "@/llm/decorators/timeout.decorator.ts";

const TIMEOUT_CORTO_MS = 20;
const TIMEOUT_LARGO_MS = 5_000;

const esperaHastaAbortar: PasoGuion = (opciones) =>
  new Promise((resolver) => {
    opciones.signal.addEventListener("abort", () => resolver(falla(TIPO_ERROR_LLM.ABORTADO)), { once: true });
  });

describe("withTimeout", () => {
  test("una base que solo responde al abortar se vuelve timeout reintentable", async () => {
    const adaptador = withTimeout(crearAdaptadorGuion([esperaHastaAbortar]), TIMEOUT_CORTO_MS);
    expect(await adaptador.enviar([], [], opcionesCon())).toEqual({
      ok: false,
      error: { tipo: TIPO_ERROR_LLM.TIMEOUT, reintentable: true, estado: null, reintentarTrasMs: null },
    });
  });

  test("si el llamador aborta primero el resultado sigue siendo abortado", async () => {
    const controlador = new AbortController();
    const adaptador = withTimeout(crearAdaptadorGuion([esperaHastaAbortar]), TIMEOUT_LARGO_MS);
    const pendiente = adaptador.enviar([], [], opcionesCon(controlador.signal));
    controlador.abort();
    const resultado = await pendiente;
    expect(resultado.ok ? null : resultado.error.tipo).toBe(TIPO_ERROR_LLM.ABORTADO);
  });

  test("una base rápida pasa sin cambios", async () => {
    const respuesta = exito();
    const adaptador = withTimeout(crearAdaptadorGuion([respuesta]), TIMEOUT_LARGO_MS);
    expect(await adaptador.enviar([], [], opcionesCon())).toBe(respuesta);
  });

  test("un error rápido de la base pasa sin cambios", async () => {
    const error = falla(TIPO_ERROR_LLM.SALDO);
    const adaptador = withTimeout(crearAdaptadorGuion([error]), TIMEOUT_LARGO_MS);
    expect(await adaptador.enviar([], [], opcionesCon())).toBe(error);
  });

  test("la base recibe una señal combinada, no la del llamador", async () => {
    const controlador = new AbortController();
    const base = crearAdaptadorGuion([exito()]);
    await withTimeout(base, TIMEOUT_LARGO_MS).enviar([], [], opcionesCon(controlador.signal));
    const [recibidas] = base.llamadas;
    expect(recibidas?.signal).not.toBe(controlador.signal);
    controlador.abort();
    expect(recibidas?.signal.aborted).toBe(true);
  });

  test("conserva proveedor y modelo de la base", () => {
    const adaptador = withTimeout(crearAdaptadorGuion([exito()]), TIMEOUT_LARGO_MS);
    expect([adaptador.proveedor, adaptador.modelo]).toEqual([PROVEEDOR_PRIMARIO, MODELO_PRIMARIO]);
  });
});
