import { TIPO_ERROR_LLM, TIPOS_ERROR_LLM_REINTENTABLES } from "@/config/constants/llm.constants.ts";
import type { AdaptadorLlm, ResultadoEnvio } from "@/llm/types/llm.type.ts";

const TIMED_OUT: ResultadoEnvio = {
  ok: false,
  error: {
    tipo: TIPO_ERROR_LLM.TIMEOUT,
    reintentable: TIPOS_ERROR_LLM_REINTENTABLES.has(TIPO_ERROR_LLM.TIMEOUT),
    estado: null,
    reintentarTrasMs: null,
  },
};

export function withTimeout(base: AdaptadorLlm, ms: number): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (messages, tools, options) => {
      const timer = AbortSignal.timeout(ms);
      const result = await base.enviar(messages, tools, {
        ...options,
        signal: AbortSignal.any([options.signal, timer]),
      });
      const timedOut = !result.ok && timer.aborted && !options.signal.aborted;
      return timedOut ? TIMED_OUT : result;
    },
  };
}
