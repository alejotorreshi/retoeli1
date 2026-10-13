import { describe, expect, test } from "bun:test";
import { CODIGO_AGENTE, CODIGO_AGENTE_POR_ERROR_LLM } from "@/config/constants/agent.constants.ts";
import {
  BACKOFF_TOPE_MS,
  FINISH_REASON,
  TIPO_ERROR_LLM,
  TIPOS_ERROR_LLM_REINTENTABLES,
} from "@/config/constants/llm.constants.ts";
import { MS_POR_SEGUNDO } from "@/config/constants/runtime.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import {
  errorFromException,
  errorFromFinishReason,
  errorFromStatus,
  invalidResponseError,
  timeoutError,
} from "@/llm/mappers/provider-error.mapper.ts";

const SEGUNDOS_REINTENTO = 3;
const SEGUNDOS_EXCESIVOS = 30;
const FECHA_HTTP = "Wed, 21 Oct 2026 07:28:00 GMT";

describe("errorFromStatus", () => {
  test.each([400, 404, 422])("%d es peticion_invalida y no se reintenta", (estado) => {
    expect(errorFromStatus(estado, null)).toEqual({
      tipo: TIPO_ERROR_LLM.PETICION_INVALIDA,
      reintentable: false,
      estado,
      reintentarTrasMs: null,
    });
  });

  test.each([401, 403])("%d es autenticacion y no se reintenta", (estado) => {
    const error = errorFromStatus(estado, null);
    expect(error.tipo).toBe(TIPO_ERROR_LLM.AUTENTICACION);
    expect(error.reintentable).toBe(false);
  });

  test("402 es saldo y no se reintenta", () => {
    const error = errorFromStatus(402, null);
    expect(error.tipo).toBe(TIPO_ERROR_LLM.SALDO);
    expect(error.reintentable).toBe(false);
  });

  test("429 con Retry-After entero en segundos lo convierte a milisegundos", () => {
    expect(errorFromStatus(429, String(SEGUNDOS_REINTENTO))).toEqual({
      tipo: TIPO_ERROR_LLM.LIMITE_TASA,
      reintentable: true,
      estado: 429,
      reintentarTrasMs: SEGUNDOS_REINTENTO * MS_POR_SEGUNDO,
    });
  });

  test("Retry-After mayor que el tope queda acotado a BACKOFF_TOPE_MS", () => {
    expect(errorFromStatus(429, String(SEGUNDOS_EXCESIVOS)).reintentarTrasMs).toBe(BACKOFF_TOPE_MS);
  });

  test.each([
    ["una fecha HTTP", FECHA_HTTP],
    ["un decimal", "1.5"],
    ["un negativo", "-3"],
    ["una cadena vacía", ""],
    ["texto", "pronto"],
  ])("429 con Retry-After como %s no fija espera", (_nombre, valor) => {
    expect(errorFromStatus(429, valor).reintentarTrasMs).toBeNull();
  });

  test("429 sin Retry-After no fija espera", () => {
    const error = errorFromStatus(429, null);
    expect(error.tipo).toBe(TIPO_ERROR_LLM.LIMITE_TASA);
    expect(error.reintentarTrasMs).toBeNull();
  });

  test.each([500, 502, 503, 504])("%d es servidor y se reintenta", (estado) => {
    const error = errorFromStatus(estado, null);
    expect(error.tipo).toBe(TIPO_ERROR_LLM.SERVIDOR);
    expect(error.reintentable).toBe(true);
  });
});

describe("errorFromFinishReason", () => {
  test("content_filter es filtro_contenido y no se reintenta", () => {
    expect(errorFromFinishReason(FINISH_REASON.CONTENT_FILTER)).toEqual({
      tipo: TIPO_ERROR_LLM.FILTRO_CONTENIDO,
      reintentable: false,
      estado: null,
      reintentarTrasMs: null,
    });
  });

  test.each([FINISH_REASON.INSUFFICIENT_SYSTEM_RESOURCE, FINISH_REASON.ERROR])(
    "%s es servidor y se reintenta",
    (fin) => {
      const error = errorFromFinishReason(fin);
      expect(error?.tipo).toBe(TIPO_ERROR_LLM.SERVIDOR);
      expect(error?.reintentable).toBe(true);
    },
  );

  test.each([
    FINISH_REASON.STOP,
    FINISH_REASON.LENGTH,
    FINISH_REASON.TOOL_CALLS,
    "desconocido",
    null,
    undefined,
  ])("%p no es un error", (fin) => {
    expect(errorFromFinishReason(fin)).toBeNull();
  });
});

describe("errores sin estado HTTP", () => {
  test("un rechazo de fetch es red y un aborto del llamador es abortado", () => {
    expect(errorFromException(false).tipo).toBe(TIPO_ERROR_LLM.RED);
    expect(errorFromException(false).reintentable).toBe(true);
    expect(errorFromException(true).tipo).toBe(TIPO_ERROR_LLM.ABORTADO);
    expect(errorFromException(true).reintentable).toBe(false);
  });

  test("un plazo vencido es timeout y se reintenta", () => {
    expect(timeoutError()).toEqual({
      tipo: TIPO_ERROR_LLM.TIMEOUT,
      reintentable: true,
      estado: null,
      reintentarTrasMs: null,
    });
  });

  test("una respuesta ilegible es respuesta_invalida y se reintenta", () => {
    expect(invalidResponseError()).toEqual({
      tipo: TIPO_ERROR_LLM.RESPUESTA_INVALIDA,
      reintentable: true,
      estado: null,
      reintentarTrasMs: null,
    });
  });
});

describe("catálogo en español", () => {
  test("solo limite_tasa, servidor, red, timeout y respuesta_invalida son reintentables", () => {
    expect([...TIPOS_ERROR_LLM_REINTENTABLES].sort()).toEqual(
      [
        TIPO_ERROR_LLM.LIMITE_TASA,
        TIPO_ERROR_LLM.SERVIDOR,
        TIPO_ERROR_LLM.RED,
        TIPO_ERROR_LLM.TIMEOUT,
        TIPO_ERROR_LLM.RESPUESTA_INVALIDA,
      ].sort(),
    );
  });

  test.each(Object.values(TIPO_ERROR_LLM))("%s tiene un mensaje en español no vacío", (tipo) => {
    expect(MENSAJE_AGENTE[CODIGO_AGENTE_POR_ERROR_LLM[tipo]].trim().length).toBeGreaterThan(0);
  });

  test("saldo dice 'Saldo agotado'", () => {
    expect(CODIGO_AGENTE_POR_ERROR_LLM[TIPO_ERROR_LLM.SALDO]).toBe(CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO);
    expect(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO].toLowerCase()).toContain("saldo agotado");
  });
});
