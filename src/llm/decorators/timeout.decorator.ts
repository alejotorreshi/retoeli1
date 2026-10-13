import { timeoutError } from "@/llm/mappers/provider-error.mapper.ts";
import type { AdaptadorLlm, ResultadoEnvio } from "@/llm/types/llm.type.ts";

const TIMED_OUT: ResultadoEnvio = { ok: false, error: timeoutError() };

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
