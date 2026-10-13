import type { Reglas } from "@/domain/types/reglas.type.ts";
import { normalizarEtiqueta } from "@/domain/utils/normalizar.util.ts";

export function etiquetasGenericas(reglas: Reglas): ReadonlySet<string> {
  return new Set(reglas.etiquetas_genericas.map(normalizarEtiqueta));
}

export function identificadorDelPais(reglas: Reglas, pais: string): string | null {
  const porPais = reglas.identificador_tributario.por_pais;
  return Object.hasOwn(porPais, pais) ? (porPais[pais] ?? null) : null;
}
