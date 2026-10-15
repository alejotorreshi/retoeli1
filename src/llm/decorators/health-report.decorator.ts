import { ESTADO_LLM, ESTADO_LLM_TRAS_ERROR } from "@/config/constants/llm.constants.ts";
import type { AdaptadorLlm, ResultadoEnvio } from "@/llm/types/llm.type.ts";
import type { LlmHealthMonitor, LlmHealthState } from "@/llm/types/resilience.type.ts";

export function createHealthMonitor(initial: LlmHealthState): LlmHealthMonitor {
  let state = initial;
  return {
    current: () => state,
    publish: (next) => {
      state = next;
    },
  };
}

function stateAfter(result: ResultadoEnvio): LlmHealthState | null {
  return result.ok ? ESTADO_LLM.DISPONIBLE : ESTADO_LLM_TRAS_ERROR[result.error.tipo];
}

export function withHealthReport(base: AdaptadorLlm, monitor: LlmHealthMonitor): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (messages, tools, options) => {
      const result = await base.enviar(messages, tools, options);
      const next = stateAfter(result);
      if (next !== null) monitor.publish(next);
      return result;
    },
  };
}
