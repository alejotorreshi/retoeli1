import {
  ACUSES,
  AFIRMACIONES,
  CONDICIONALES,
  DECISION_CONFIRMACION,
  MAX_PALABRAS_CONFIRMACION,
  NEGACIONES,
  NEGADORES,
  PRONOMBRES_ATONOS,
  RELLENO,
  SI_CON_TILDE,
  SI_SIN_TILDE,
  VERBOS_ENVIO,
  VERBOS_NEGABLES,
} from "@/config/constants/confirmation.constants.ts";
import {
  PATRON_CLAUSULA,
  PATRON_NO_PALABRA,
  PATRON_NO_PALABRA_UNICODE,
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
  return esAfirmacionFuerte(palabra) || esAcuse(palabra) || RELLENO.has(palabra) || palabra === SI_SIN_TILDE;
}

function tieneSiConTilde(texto: string): boolean {
  return texto.normalize("NFC").toLowerCase().split(PATRON_NO_PALABRA_UNICODE).includes(SI_CON_TILDE);
}

function esSiSuelto({ slugs, palabras }: Frase): boolean {
  return slugs.length === 0 && palabras.length === 1 && palabras[0] === SI_SIN_TILDE;
}

function tieneFuerza(texto: string, frase: Frase): boolean {
  return frase.palabras.some(esAfirmacionFuerte) || tieneSiConTilde(texto) || esSiSuelto(frase);
}

function esConfirmacionClara(texto: string, frase: Frase): boolean {
  const { palabras } = frase;
  if (palabras.length > MAX_PALABRAS_CONFIRMACION) return false;
  if (palabras.some((palabra) => CONDICIONALES.has(palabra))) return false;
  if (!palabras.every(esPermitida)) return false;
  return tieneFuerza(texto, frase);
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

function verboTrasNegador(palabras: readonly string[], desde: number): string | undefined {
  return palabras.slice(desde + 1).find((palabra) => !PRONOMBRES_ATONOS.has(palabra));
}

function niegaElEnvio(palabras: readonly string[]): boolean {
  return palabras.some((palabra, indice) => {
    if (!NEGADORES.has(palabra)) return false;
    const verbo = verboTrasNegador(palabras, indice);
    return verbo !== undefined && VERBOS_NEGABLES.has(verbo);
  });
}

function esPalabraDeEspera(palabra: string): boolean {
  return NEGACIONES.has(palabra) || RELLENO.has(palabra);
}

function esClausulaDeEspera(clausula: string): boolean {
  if (PATRON_PREGUNTA.test(clausula)) return false;
  const { palabras } = separar(clausula);
  return palabras.some((palabra) => NEGACIONES.has(palabra)) && palabras.every(esPalabraDeEspera);
}

function esRechazoExplicito(normalizado: string, frase: Frase): boolean {
  if (niegaElEnvio(frase.palabras)) return true;
  const clausulas = normalizado.match(PATRON_CLAUSULA) ?? [];
  return clausulas.some(esClausulaDeEspera);
}

export function clasificarConfirmacion(texto: string, pendientes: readonly string[]): DecisionConfirmacion {
  const normalizado = sinDiacriticos(texto).toLowerCase().trim();
  if (normalizado === "") return OTRO;
  const frase = separar(normalizado);
  if (esRechazoExplicito(normalizado, frase)) return RECHAZA;
  if (PATRON_PREGUNTA.test(texto)) return OTRO;
  if (!esConfirmacionClara(texto, frase)) return OTRO;
  return casoConfirmado(frase.slugs, pendientes);
}
