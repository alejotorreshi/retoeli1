import { describe, expect, test } from "bun:test";
import {
  crearAdaptadorGuion,
  exito,
  falla,
  MODELO_PRIMARIO,
  MODELO_RESPALDO,
  opcionesCon,
  PROVEEDOR_PRIMARIO,
  PROVEEDOR_RESPALDO,
} from "@tests/helpers/adaptador-guion.helper.ts";
import {
  BACKOFF_BASE_MS,
  BACKOFF_TOPE_MS,
  TIMEOUT_LLM_MS_POR_DEFECTO,
  TIPO_ERROR_LLM,
} from "@/config/constants/llm.constants.ts";
import { withFallback } from "@/llm/decorators/fallback.decorator.ts";
import { withRetry } from "@/llm/decorators/retry.decorator.ts";
import { withTimeout } from "@/llm/decorators/timeout.decorator.ts";
import type { ErrorLlm, ResultadoEnvio } from "@/llm/types/llm.type.ts";
import type { RetryOptions } from "@/llm/types/resilience.type.ts";

const MAX_REINTENTOS = 2;

function registroDeCambios(): {
  readonly cambios: ErrorLlm[];
  readonly alCambiar: (error: ErrorLlm) => void;
} {
  const cambios: ErrorLlm[] = [];
  return { cambios, alCambiar: (error) => cambios.push(error) };
}

function respaldoExitoso() {
  return crearAdaptadorGuion(
    [exito(PROVEEDOR_RESPALDO, MODELO_RESPALDO)],
    PROVEEDOR_RESPALDO,
    MODELO_RESPALDO,
  );
}

function modeloDe(resultado: ResultadoEnvio): string | null {
  return resultado.ok ? resultado.respuesta.modelo : null;
}

describe("withFallback", () => {
  test("alCambiar recibe las mismas opciones del envío, para correlacionar el aviso del turno", async () => {
    const opciones = opcionesCon();
    const recibidas: unknown[] = [];
    await withFallback(
      crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR)]),
      respaldoExitoso(),
      (_error, envio) => recibidas.push(envio),
    ).enviar([], [], opciones);
    expect(recibidas).toEqual([opciones]);
  });

  test("un primario con servidor cambia una vez al respaldo y reporta su modelo", async () => {
    const errorPrimario = falla(TIPO_ERROR_LLM.SERVIDOR);
    const primario = crearAdaptadorGuion([errorPrimario]);
    const respaldo = respaldoExitoso();
    const { cambios, alCambiar } = registroDeCambios();
    const resultado = await withFallback(primario, respaldo, alCambiar).enviar([], [], opcionesCon());
    expect(respaldo.llamadas).toHaveLength(1);
    expect(cambios).toHaveLength(1);
    expect(cambios[0]?.tipo).toBe(TIPO_ERROR_LLM.SERVIDOR);
    expect(primario.llamadas).toHaveLength(1);
    expect(modeloDe(resultado)).toBe(MODELO_RESPALDO);
  });

  test.each([
    TIPO_ERROR_LLM.SALDO,
    TIPO_ERROR_LLM.AUTENTICACION,
    TIPO_ERROR_LLM.PETICION_INVALIDA,
    TIPO_ERROR_LLM.FILTRO_CONTENIDO,
  ])("un primario con %s devuelve su error sin llamar al respaldo", async (tipo) => {
    const errorPrimario = falla(tipo);
    const respaldo = respaldoExitoso();
    const { cambios, alCambiar } = registroDeCambios();
    const resultado = await withFallback(crearAdaptadorGuion([errorPrimario]), respaldo, alCambiar).enviar(
      [],
      [],
      opcionesCon(),
    );
    expect(resultado).toBe(errorPrimario);
    expect(respaldo.llamadas).toHaveLength(0);
    expect(cambios).toHaveLength(0);
  });

  test("sin respaldo devuelve el error del primario", async () => {
    const errorPrimario = falla(TIPO_ERROR_LLM.SERVIDOR);
    const { cambios, alCambiar } = registroDeCambios();
    const resultado = await withFallback(crearAdaptadorGuion([errorPrimario]), null, alCambiar).enviar(
      [],
      [],
      opcionesCon(),
    );
    expect(resultado).toBe(errorPrimario);
    expect(cambios).toHaveLength(0);
  });

  test("un primario exitoso nunca llama al respaldo", async () => {
    const respuesta = exito();
    const respaldo = respaldoExitoso();
    const resultado = await withFallback(crearAdaptadorGuion([respuesta]), respaldo, () => {}).enviar(
      [],
      [],
      opcionesCon(),
    );
    expect(resultado).toBe(respuesta);
    expect(respaldo.llamadas).toHaveLength(0);
  });

  test("una señal del llamador ya abortada nunca llama al respaldo", async () => {
    const respaldo = respaldoExitoso();
    const { cambios, alCambiar } = registroDeCambios();
    await withFallback(crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR)]), respaldo, alCambiar).enviar(
      [],
      [],
      opcionesCon(AbortSignal.abort()),
    );
    expect(respaldo.llamadas).toHaveLength(0);
    expect(cambios).toHaveLength(0);
  });

  test("el compuesto expone proveedor y modelo del primario", () => {
    const compuesto = withFallback(crearAdaptadorGuion([exito()]), respaldoExitoso(), () => {});
    expect([compuesto.proveedor, compuesto.modelo]).toEqual([PROVEEDOR_PRIMARIO, MODELO_PRIMARIO]);
  });
});

describe("composición timeout, reintento y respaldo", () => {
  test("un primario que siempre falla agota sus reintentos y luego usa el respaldo", async () => {
    const esperas: number[] = [];
    const reintento: RetryOptions = {
      maxRetries: MAX_REINTENTOS,
      baseMs: BACKOFF_BASE_MS,
      capMs: BACKOFF_TOPE_MS,
      wait: async (ms) => {
        esperas.push(ms);
      },
      random: () => 0,
    };
    const primario = crearAdaptadorGuion([falla(TIPO_ERROR_LLM.SERVIDOR)]);
    const respaldo = respaldoExitoso();
    const { cambios, alCambiar } = registroDeCambios();
    const compuesto = withFallback(
      withRetry(withTimeout(primario, TIMEOUT_LLM_MS_POR_DEFECTO), reintento),
      withRetry(withTimeout(respaldo, TIMEOUT_LLM_MS_POR_DEFECTO), reintento),
      alCambiar,
    );
    const resultado = await compuesto.enviar([], [], opcionesCon());
    expect(primario.llamadas).toHaveLength(1 + MAX_REINTENTOS);
    expect(respaldo.llamadas).toHaveLength(1);
    expect(cambios.map((error) => error.tipo)).toEqual([TIPO_ERROR_LLM.SERVIDOR]);
    expect(modeloDe(resultado)).toBe(MODELO_RESPALDO);
    expect(esperas).toHaveLength(MAX_REINTENTOS);
  });
});
