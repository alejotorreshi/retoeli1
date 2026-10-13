import type { AdaptadorLlm } from "@/llm/types/llm.type.ts";
import type { AlCambiarProveedor } from "@/llm/types/resiliencia.type.ts";

export function withFallback(
  primario: AdaptadorLlm,
  respaldo: AdaptadorLlm | null,
  alCambiar: AlCambiarProveedor,
): AdaptadorLlm {
  return {
    proveedor: primario.proveedor,
    modelo: primario.modelo,
    enviar: async (mensajes, herramientas, opciones) => {
      const resultado = await primario.enviar(mensajes, herramientas, opciones);
      if (resultado.ok || !resultado.error.reintentable) return resultado;
      if (respaldo === null || opciones.signal.aborted) return resultado;
      alCambiar(resultado.error);
      return respaldo.enviar(mensajes, herramientas, opciones);
    },
  };
}
