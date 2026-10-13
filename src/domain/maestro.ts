import { CLAVES_PROHIBIDAS, TIPO_HOJA_MAESTRO } from "@/config/constants/mapping.constants.ts";
import { PATRON_SEGMENTO_RUTA, PATRON_TEXTO_NO_VACIO } from "@/config/constants/patterns.constants.ts";
import { aTexto } from "@/domain/normalizar.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { HojaMaestro } from "@/domain/types/mapeo.type.ts";

const AUSENTE: HojaMaestro = { tipo: TIPO_HOJA_MAESTRO.AUSENTE };
const NO_TEXTUAL: HojaMaestro = { tipo: TIPO_HOJA_MAESTRO.NO_TEXTUAL };

export function segmentoValido(segmento: string): boolean {
  return PATRON_SEGMENTO_RUTA.test(segmento) && !CLAVES_PROHIBIDAS.has(segmento);
}

function valorEnRuta(maestro: Maestro, ruta: string): unknown {
  let actual: unknown = maestro;
  for (const segmento of ruta.split(".")) {
    if (!segmentoValido(segmento)) return undefined;
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(actual, segmento);
    if (descriptor === undefined || !("value" in descriptor)) return undefined;
    actual = descriptor.value;
  }
  return actual;
}

function hojaDe(valor: unknown): HojaMaestro {
  if (typeof valor === "number") return { tipo: TIPO_HOJA_MAESTRO.TEXTO, valor: aTexto(valor) };
  if (typeof valor === "string")
    return PATRON_TEXTO_NO_VACIO.test(valor) ? { tipo: TIPO_HOJA_MAESTRO.TEXTO, valor } : AUSENTE;
  if (typeof valor === "boolean") return NO_TEXTUAL;
  if (typeof valor === "object" && valor !== null && Object.keys(valor).length > 0) return NO_TEXTUAL;
  return AUSENTE;
}

export function leerHoja(maestro: Maestro, ruta: string): HojaMaestro {
  return hojaDe(valorEnRuta(maestro, ruta));
}

export function leerRuta(maestro: Maestro, ruta: string): string | null {
  const hoja = leerHoja(maestro, ruta);
  return hoja.tipo === TIPO_HOJA_MAESTRO.TEXTO ? hoja.valor : null;
}
