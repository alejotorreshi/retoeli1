const MARCAS_DIACRITICAS = /[̀-ͯ]/g;
const ESPACIOS = /\s+/g;
const MARCAS_FINALES = /[\s:*]+$/u;

export function normalizarEtiqueta(etiqueta: string): string {
  return etiqueta
    .normalize("NFD")
    .replace(MARCAS_DIACRITICAS, "")
    .toLowerCase()
    .replace(ESPACIOS, " ")
    .trim()
    .replace(MARCAS_FINALES, "")
    .trim();
}

export function aTexto(valor: string | number): string {
  return typeof valor === "number" ? String(valor) : valor;
}
