import type { AdaptadorLlm } from "@/llm/types/llm.type.ts";

export function withObservation(base: AdaptadorLlm): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (messages, tools, options) => {
      const startedAt = Date.now();
      const result = await base.enviar(messages, tools, options);
      if (!result.ok) {
        options.observador?.fallo({
          proveedor: base.proveedor,
          modelo: base.modelo,
          duracionMs: Date.now() - startedAt,
          error: result.error,
        });
      }
      return result;
    },
  };
}
