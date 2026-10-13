import {
  BACKOFF_TOPE_MS,
  ESTADO_HTTP,
  MS_POR_SEGUNDO,
  TIPO_ERROR_LLM,
  TIPO_ERROR_POR_FIN,
  TIPOS_ERROR_LLM_REINTENTABLES,
} from "@/config/constants/llm.constants.ts";
import { PATRON_ENTERO_NO_NEGATIVO } from "@/config/constants/patterns.constants.ts";
import type { ErrorLlm, TipoErrorLlm } from "@/llm/types/llm.type.ts";

function errorOfType(
  type: TipoErrorLlm,
  status: number | null,
  retryAfterMs: number | null = null,
): ErrorLlm {
  return {
    tipo: type,
    reintentable: TIPOS_ERROR_LLM_REINTENTABLES.has(type),
    estado: status,
    reintentarTrasMs: retryAfterMs,
  };
}

function typeForStatus(status: number): TipoErrorLlm {
  if (status === ESTADO_HTTP.NO_AUTORIZADO || status === ESTADO_HTTP.PROHIBIDO) {
    return TIPO_ERROR_LLM.AUTENTICACION;
  }
  if (status === ESTADO_HTTP.PAGO_REQUERIDO) return TIPO_ERROR_LLM.SALDO;
  if (status === ESTADO_HTTP.DEMASIADAS_PETICIONES) return TIPO_ERROR_LLM.LIMITE_TASA;
  if (status >= ESTADO_HTTP.ERROR_SERVIDOR) return TIPO_ERROR_LLM.SERVIDOR;
  return TIPO_ERROR_LLM.PETICION_INVALIDA;
}

function retryDelayFrom(retryAfter: string | null): number | null {
  if (retryAfter === null || !PATRON_ENTERO_NO_NEGATIVO.test(retryAfter)) return null;
  return Math.min(BACKOFF_TOPE_MS, Number(retryAfter) * MS_POR_SEGUNDO);
}

export function errorFromStatus(status: number, retryAfter: string | null): ErrorLlm {
  return errorOfType(typeForStatus(status), status, retryDelayFrom(retryAfter));
}

export function errorFromFinishReason(finishReason: string | null | undefined): ErrorLlm | null {
  if (finishReason === null || finishReason === undefined) return null;
  const type = TIPO_ERROR_POR_FIN.get(finishReason);
  return type === undefined ? null : errorOfType(type, null);
}

export function errorFromException(abortedByCaller: boolean): ErrorLlm {
  return errorOfType(abortedByCaller ? TIPO_ERROR_LLM.ABORTADO : TIPO_ERROR_LLM.RED, null);
}

export function timeoutError(): ErrorLlm {
  return errorOfType(TIPO_ERROR_LLM.TIMEOUT, null);
}

export function invalidResponseError(): ErrorLlm {
  return errorOfType(TIPO_ERROR_LLM.RESPUESTA_INVALIDA, null);
}
