import type { AdaptadorLlm } from "@/llm/types/llm.type.ts";

export function withObservacion(base: AdaptadorLlm): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (mensajes, herramientas, opciones) => {
      const desde = Date.now();
      const resultado = await base.enviar(mensajes, herramientas, opciones);
      if (!resultado.ok) {
        opciones.observador?.fallo({
          proveedor: base.proveedor,
          modelo: base.modelo,
          duracionMs: Date.now() - desde,
          error: resultado.error,
        });
      }
      return resultado;
    },
  };
}
