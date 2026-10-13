import { TIPO_ERROR_LLM, TIPOS_ERROR_LLM_REINTENTABLES } from "@/config/constants/llm.constants.ts";
import type { AdaptadorLlm, ResultadoEnvio } from "@/llm/types/llm.type.ts";

const FALLA_POR_TIEMPO: ResultadoEnvio = {
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
    enviar: async (mensajes, herramientas, opciones) => {
      const porTiempo = AbortSignal.timeout(ms);
      const resultado = await base.enviar(mensajes, herramientas, {
        ...opciones,
        signal: AbortSignal.any([opciones.signal, porTiempo]),
      });
      const vencido = !resultado.ok && porTiempo.aborted && !opciones.signal.aborted;
      return vencido ? FALLA_POR_TIEMPO : resultado;
    },
  };
}
