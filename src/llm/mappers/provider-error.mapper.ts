import {
  ESTADO_HTTP,
  TIPO_ERROR_LLM,
  TIPOS_ERROR_LLM_REINTENTABLES,
} from "@/config/constants/llm.constants.ts";
import type { ErrorLlm, TipoErrorLlm } from "@/llm/types/llm.type.ts";

function errorDeTipo(tipo: TipoErrorLlm, estado: number | null): ErrorLlm {
  return { tipo, reintentable: TIPOS_ERROR_LLM_REINTENTABLES.has(tipo), estado, reintentarTrasMs: null };
}

function tipoPorEstado(status: number): TipoErrorLlm {
  if (status === ESTADO_HTTP.NO_AUTORIZADO || status === ESTADO_HTTP.PROHIBIDO) {
    return TIPO_ERROR_LLM.AUTENTICACION;
  }
  if (status === ESTADO_HTTP.PAGO_REQUERIDO) return TIPO_ERROR_LLM.SALDO;
  if (status === ESTADO_HTTP.DEMASIADAS_PETICIONES) return TIPO_ERROR_LLM.LIMITE_TASA;
  if (status >= ESTADO_HTTP.ERROR_SERVIDOR) return TIPO_ERROR_LLM.SERVIDOR;
  return TIPO_ERROR_LLM.PETICION_INVALIDA;
}

export function errorFromStatus(status: number): ErrorLlm {
  return errorDeTipo(tipoPorEstado(status), status);
}

export function errorFromException(abortadoPorLlamador: boolean): ErrorLlm {
  return errorDeTipo(abortadoPorLlamador ? TIPO_ERROR_LLM.ABORTADO : TIPO_ERROR_LLM.RED, null);
}

export function invalidResponseError(): ErrorLlm {
  return errorDeTipo(TIPO_ERROR_LLM.RESPUESTA_INVALIDA, null);
}
