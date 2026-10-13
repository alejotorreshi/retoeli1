import {
  PATRON_BORDE_TABLA_MD,
  PATRON_ENCABEZADO_MD,
  PATRON_NEGRITA,
  PATRON_SEPARADOR_TABLA_MD,
} from "@/config/constants/patterns.constants.ts";
import {
  SALTO_DE_LINEA,
  SEPARADOR_CELDA_MD,
  SEPARADOR_CELDA_PLANO,
} from "@/config/constants/text.constants.ts";

function filaPlana(linea: string): string {
  if (!linea.includes(SEPARADOR_CELDA_MD)) return linea;
  return linea
    .replace(PATRON_BORDE_TABLA_MD, "")
    .split(SEPARADOR_CELDA_MD)
    .map((celda) => celda.trim())
    .join(SEPARADOR_CELDA_PLANO);
}

export function limpiarMarkdown(texto: string): string {
  return texto
    .replace(PATRON_SEPARADOR_TABLA_MD, "")
    .replace(PATRON_NEGRITA, "")
    .replace(PATRON_ENCABEZADO_MD, "")
    .split(SALTO_DE_LINEA)
    .map(filaPlana)
    .join(SALTO_DE_LINEA);
}
