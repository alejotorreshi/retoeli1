import type { AdaptadorLlm } from "@/llm/types/llm.type.ts";
import type { OnProviderSwitch } from "@/llm/types/resilience.type.ts";

export function withFallback(
  primary: AdaptadorLlm,
  fallback: AdaptadorLlm | null,
  onSwitch: OnProviderSwitch,
): AdaptadorLlm {
  return {
    proveedor: primary.proveedor,
    modelo: primary.modelo,
    enviar: async (messages, tools, options) => {
      const result = await primary.enviar(messages, tools, options);
      if (result.ok || !result.error.reintentable) return result;
      if (fallback === null || options.signal.aborted) return result;
      onSwitch(result.error, options);
      return fallback.enviar(messages, tools, options);
    },
  };
}
