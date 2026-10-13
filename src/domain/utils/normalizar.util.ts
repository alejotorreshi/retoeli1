import {
  PATRON_DIACRITICOS,
  PATRON_ESPACIOS,
  PATRON_MARCAS_FINALES,
} from "@/config/constants/patterns.constants.ts";
export function normalizarEtiqueta(etiqueta: string): string {
  return etiqueta
    .normalize("NFD")
    .replace(PATRON_DIACRITICOS, "")
    .toLowerCase()
    .replace(PATRON_ESPACIOS, " ")
    .trim()
    .replace(PATRON_MARCAS_FINALES, "")
    .trim();
}

export function aTexto(valor: string | number): string {
  return typeof valor === "number" ? String(valor) : valor;
}
