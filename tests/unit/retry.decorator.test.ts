import { describe, expect, test } from "bun:test";
import { crearAdaptadorGuion, exito, falla, opcionesCon } from "@tests/helpers/adaptador-guion.helper.ts";
import { BACKOFF_BASE_MS, BACKOFF_TOPE_MS, TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { withRetry } from "@/llm/decorators/retry.decorator.ts";
import type { ResultadoEnvio, TipoErrorLlm } from "@/llm/types/llm.type.ts";
import type { OpcionesReintento } from "@/llm/types/resiliencia.type.ts";

const MAX_REINTENTOS = 2;
const AZAR_MEDIO = 0.5;
const RETRY_AFTER_MS = 3_000;

type Reloj = { readonly esperas: number[]; readonly opciones: OpcionesReintento };

function reloj(maxReintentos = MAX_REINTENTOS, alEsperar: () => Promise<void> = async () => {}): Reloj {
  const esperas: number[] = [];
  return {
    esperas,
    opciones: {
      maxReintentos,
      baseMs: BACKOFF_BASE_MS,
      topeMs: BACKOFF_TOPE_MS,
      esperar: async (ms) => {
        esperas.push(ms);
        await alEsperar();
      },
      azar: () => AZAR_MEDIO,
    },
  };
}

function tipoDe(resultado: ResultadoEnvio): TipoErrorLlm | null {
  return resultado.ok ? null : resultado.error.tipo;
}

describe("withRetry", () => {
  test("tres fallos de servidor hacen tres llamadas con espera de jitter completo", async () => {
    const ultimo = falla(TIPO_ERROR_LLM.SERVIDOR);
    const base = crearAdaptadorGuion([
      falla(TIPO_ERROR_LLM.SERVIDOR),
      falla(TIPO_ERROR_LLM.SERVIDOR),
      ultimo,
    ]);
    const { esperas, opciones } = reloj();
    const resultado = await withRetry(base, opciones).enviar([], [], opcionesCon());
    expect(base.llamadas).toHaveLength(1 + MAX_REINTENTOS);
    expect(resultado).toBe(ultimo);
    expect(esperas).toEqual([250, 500]);
  });

  test("servidor y luego éxito hace dos llamadas y devuelve el éxito", async () => {
    const respuesta = exito();
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR), respuesta]);
    const resultado = await withRetry(base, reloj().opciones).enviar([], [], opcionesCon());
    expect(base.llamadas).toHaveLength(2);
    expect(resultado).toBe(respuesta);
  });

  test("limite_tasa con Retry-After espera exactamente ese valor", async () => {
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.LIMITE_TASA, RETRY_AFTER_MS), exito()]);
    const { esperas, opciones } = reloj();
    await withRetry(base, opciones).enviar([], [], opcionesCon());
    expect(esperas).toEqual([RETRY_AFTER_MS]);
  });

  test("la espera nunca supera el tope", async () => {
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.LIMITE_TASA, BACKOFF_TOPE_MS * 4), exito()]);
    const { esperas, opciones } = reloj();
    await withRetry(base, opciones).enviar([], [], opcionesCon());
    expect(esperas).toEqual([BACKOFF_TOPE_MS]);
  });

  test.each([
    TIPO_ERROR_LLM.PETICION_INVALIDA,
    TIPO_ERROR_LLM.AUTENTICACION,
    TIPO_ERROR_LLM.SALDO,
    TIPO_ERROR_LLM.FILTRO_CONTENIDO,
    TIPO_ERROR_LLM.ABORTADO,
  ])("%s no se reintenta", async (tipo) => {
    const base = crearAdaptadorGuion([falla(tipo), exito()]);
    const { esperas, opciones } = reloj();
    const resultado = await withRetry(base, opciones).enviar([], [], opcionesCon());
    expect(base.llamadas).toHaveLength(1);
    expect(tipoDe(resultado)).toBe(tipo);
    expect(esperas).toEqual([]);
  });

  test("un aborto del llamador durante la espera detiene los reintentos", async () => {
    const controlador = new AbortController();
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR), exito()]);
    const { opciones } = reloj(MAX_REINTENTOS, async () => controlador.abort());
    const resultado = await withRetry(base, opciones).enviar([], [], opcionesCon(controlador.signal));
    expect(base.llamadas).toHaveLength(1);
    expect(tipoDe(resultado)).toBe(TIPO_ERROR_LLM.ABORTADO);
  });

  test("una espera que rechaza cuenta como aborto y no lanza", async () => {
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.RED), exito()]);
    const { opciones } = reloj(MAX_REINTENTOS, async () => {
      throw new Error("abortado");
    });
    const resultado = await withRetry(base, opciones).enviar([], [], opcionesCon());
    expect(base.llamadas).toHaveLength(1);
    expect(tipoDe(resultado)).toBe(TIPO_ERROR_LLM.ABORTADO);
  });

  test("la espera recibe la señal del llamador", async () => {
    const controlador = new AbortController();
    const senales: AbortSignal[] = [];
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR), exito()]);
    const { opciones } = reloj();
    const conSenal: OpcionesReintento = {
      ...opciones,
      esperar: async (_ms, signal) => {
        senales.push(signal);
      },
    };
    await withRetry(base, conSenal).enviar([], [], opcionesCon(controlador.signal));
    expect(senales).toEqual([controlador.signal]);
  });

  test("maxReintentos 0 hace una sola llamada", async () => {
    const base = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR), exito()]);
    const resultado = await withRetry(base, reloj(0).opciones).enviar([], [], opcionesCon());
    expect(base.llamadas).toHaveLength(1);
    expect(tipoDe(resultado)).toBe(TIPO_ERROR_LLM.SERVIDOR);
  });
});
