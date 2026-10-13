import {
  ACUSES,
  AFIRMACIONES,
  CONDICIONALES,
  DECISION_CONFIRMACION,
  MAX_PALABRAS_CONFIRMACION,
  NEGACIONES,
  RELLENO,
  VERBOS_ENVIO,
} from "@/config/constants/confirmacion.constants.ts";
import {
  PATRON_NO_PALABRA,
  PATRON_PREGUNTA,
  PATRON_SLUG_EN_TEXTO,
} from "@/config/constants/patterns.constants.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";
import { sinDiacriticos } from "@/domain/utils/normalizar.util.ts";

const OTRO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.OTRO };
const RECHAZA: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.RECHAZA };
const FALTA_CASO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.FALTA_CASO };

type Frase = { readonly slugs: readonly string[]; readonly palabras: readonly string[] };

function separar(normalizado: string): Frase {
  const slugs = normalizado.match(PATRON_SLUG_EN_TEXTO) ?? [];
  const palabras = normalizado
    .replace(PATRON_SLUG_EN_TEXTO, " ")
    .split(PATRON_NO_PALABRA)
    .filter((palabra) => palabra !== "");
  return { slugs, palabras };
}

function esAfirmacionFuerte(palabra: string): boolean {
  return AFIRMACIONES.has(palabra) || VERBOS_ENVIO.has(palabra);
}

function esAcuse(palabra: string): boolean {
  return ACUSES.has(palabra);
}

function esPermitida(palabra: string): boolean {
  return esAfirmacionFuerte(palabra) || esAcuse(palabra) || RELLENO.has(palabra);
}

function soloAcuses(palabras: readonly string[]): boolean {
  return palabras.length > 0 && palabras.every(esAcuse);
}

function esConfirmacionClara(palabras: readonly string[]): boolean {
  if (palabras.length > MAX_PALABRAS_CONFIRMACION) return false;
  if (palabras.some((palabra) => CONDICIONALES.has(palabra))) return false;
  if (!palabras.every(esPermitida)) return false;
  return palabras.some(esAfirmacionFuerte) || soloAcuses(palabras);
}

function casoConfirmado(slugs: readonly string[], pendientes: readonly string[]): DecisionConfirmacion {
  if (slugs.length > 1) return OTRO;
  const [nombrado] = slugs;
  if (nombrado !== undefined) {
    return pendientes.includes(nombrado)
      ? { decision: DECISION_CONFIRMACION.CONFIRMA, caso: nombrado }
      : OTRO;
  }
  const [unico] = pendientes;
  if (unico === undefined) return OTRO;
  return pendientes.length === 1 ? { decision: DECISION_CONFIRMACION.CONFIRMA, caso: unico } : FALTA_CASO;
}

export function clasificarConfirmacion(texto: string, pendientes: readonly string[]): DecisionConfirmacion {
  const normalizado = sinDiacriticos(texto).toLowerCase().trim();
  if (normalizado === "" || PATRON_PREGUNTA.test(texto)) return OTRO;
  const { slugs, palabras } = separar(normalizado);
  if (palabras.some((palabra) => NEGACIONES.has(palabra))) return RECHAZA;
  if (!esConfirmacionClara(palabras)) return OTRO;
  return casoConfirmado(slugs, pendientes);
}
