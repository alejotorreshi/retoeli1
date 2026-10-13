import { normalizarEtiqueta } from "@/domain/normalizar.ts";
import type { Reglas } from "@/domain/reglas.ts";
import type { CampoSolicitado, Formato, Plantilla, TipoPlantilla } from "@/domain/tipos.ts";

export type PlantillasPresentes = { readonly celdas: boolean; readonly campos: boolean };

export type CampoAmbiguo = {
  readonly etiqueta: string;
  readonly estado: "requiere_confirmacion";
  readonly propuesta: string | null;
};

const PLANTILLA_DEL_FORMATO: Readonly<Record<Formato, TipoPlantilla>> = {
  xlsx: "celdas",
  pdf: "campos",
  portal: "campos",
};

export function elegirPlantilla(formato: Formato, presentes: PlantillasPresentes): TipoPlantilla | null {
  if (presentes.celdas && presentes.campos) return PLANTILLA_DEL_FORMATO[formato];
  if (presentes.celdas) return "celdas";
  if (presentes.campos && formato !== "xlsx") return "campos";
  return null;
}

export function camposSolicitados(plantilla: Plantilla): CampoSolicitado[] {
  if (plantilla.tipo === "celdas") {
    return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: null }));
  }
  return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: campo.obligatorio }));
}

export function detectarAmbiguos(
  campos: readonly CampoSolicitado[],
  reglas: Reglas,
  pais: string,
): CampoAmbiguo[] {
  const genericas = new Set(reglas.etiquetas_genericas.map(normalizarEtiqueta));
  const porPais = reglas.identificador_tributario.por_pais;
  const propuesta = Object.hasOwn(porPais, pais) ? (porPais[pais] ?? null) : null;
  return campos
    .filter((campo) => genericas.has(normalizarEtiqueta(campo.etiqueta)))
    .map((campo) => ({ etiqueta: campo.etiqueta, estado: "requiere_confirmacion", propuesta }));
}
