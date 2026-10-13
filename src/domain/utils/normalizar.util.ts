import {
  PATRON_DIACRITICOS,
  PATRON_ESPACIOS,
  PATRON_MARCAS_FINALES,
} from "@/config/constants/patterns.constants.ts";

export function sinDiacriticos(texto: string): string {
  return texto.normalize("NFD").replace(PATRON_DIACRITICOS, "");
}

export function normalizarEtiqueta(etiqueta: string): string {
  return sinDiacriticos(etiqueta)
    .toLowerCase()
    .replace(PATRON_ESPACIOS, " ")
    .trim()
    .replace(PATRON_MARCAS_FINALES, "")
    .trim();
}
