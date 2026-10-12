import type { CampoSolicitado, Formato, Plantilla, TipoPlantilla } from "./tipos.ts";

export type PlantillasPresentes = { readonly celdas: boolean; readonly campos: boolean };

export function elegirPlantilla(formato: Formato, presentes: PlantillasPresentes): TipoPlantilla | null {
  if (presentes.celdas === presentes.campos) return null;
  if (presentes.celdas) return "celdas";
  return formato === "xlsx" ? null : "campos";
}

export function camposSolicitados(plantilla: Plantilla): CampoSolicitado[] {
  if (plantilla.tipo === "celdas") {
    return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: null }));
  }
  return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: campo.obligatorio }));
}
