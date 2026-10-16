import type { OpcionesPreflight, ResultadoPreflight } from "@/cli/types/preflight.type.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";

export async function ejecutarPreflight(opciones: OpcionesPreflight): Promise<ResultadoPreflight> {
  opciones.escribir(TEXTO_PREFLIGHT.resultadoFallido);
  return { fallido: true, tokens: null };
}
