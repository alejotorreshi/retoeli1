import {
  ACUSES,
  AFIRMACIONES,
  CANCELACIONES,
  COMPLEMENTOS_DE_ENVIO,
  CONDICIONALES,
  CORTES_DE_COMPLEMENTO,
  DECISION_CONFIRMACION,
  ENLACES_MODALES,
  INFINITIVOS_NEGABLES,
  INTERROGATIVOS,
  MAX_PALABRAS_CONFIRMACION,
  MODALES_NEGABLES,
  NEGACIONES,
  NEGADORES,
  NUCLEOS_DE_RECHAZO,
  PRONOMBRES_ATONOS,
  RELLENO,
  RELLENO_DE_ESPERA,
  SI_CON_TILDE,
  SI_SIN_TILDE,
  SIGNO_DE_MOTIVO,
  SUFIJO_PRETERITO,
  VERBOS_DE_PEDIDO,
  VERBOS_ENVIO,
  VERBOS_GENERICOS_NEGABLES,
  VERBOS_NEGABLES,
} from "@/config/constants/confirmation.constants.ts";
import {
  PATRON_APERTURA_PREGUNTA,
  PATRON_CLAUSULA,
  PATRON_NO_PALABRA,
  PATRON_NO_PALABRA_UNICODE,
  PATRON_PALABRA_O_CASO,
  PATRON_PREGUNTA,
  PATRON_SLUG_COMPLETO,
  PATRON_SLUG_EN_TEXTO,
} from "@/config/constants/patterns.constants.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";
import { sinDiacriticos } from "@/domain/utils/normalizar.util.ts";

const OTRO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.OTRO };
const RECHAZA: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.RECHAZA };
const FALTA_CASO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.FALTA_CASO };

type Frase = { readonly slugs: readonly string[]; readonly palabras: readonly string[] };
type Token = {
  readonly crudo: string;
  readonly base: string;
  readonly caso: boolean;
  readonly trasMotivo: boolean;
};
type Clausula = { readonly tokens: readonly Token[]; readonly pregunta: boolean };

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

function tokensDe(segmento: string): readonly Token[] {
  const tokens: Token[] = [];
  let finAnterior = 0;
  for (const coincidencia of segmento.matchAll(PATRON_PALABRA_O_CASO)) {
    const [crudo] = coincidencia;
    const inicio = coincidencia.index;
    const trasMotivo = tokens.length > 0 && segmento.slice(finAnterior, inicio).includes(SIGNO_DE_MOTIVO);
    tokens.push({ crudo, base: sinDiacriticos(crudo), caso: PATRON_SLUG_COMPLETO.test(crudo), trasMotivo });
    finAnterior = inicio + crudo.length;
  }
  return tokens;
}

function clausulasDe(segmento: string): readonly Clausula[] {
  const tokens = tokensDe(segmento);
  if (!PATRON_PREGUNTA.test(segmento)) return [{ tokens, pregunta: false }];
  if (PATRON_APERTURA_PREGUNTA.test(segmento)) return [{ tokens, pregunta: true }];
  const interrogativo = tokens.findIndex((token) => INTERROGATIVOS.has(token.base));
  if (interrogativo <= 0) return [{ tokens, pregunta: true }];
  return [
    { tokens: tokens.slice(0, interrogativo), pregunta: false },
    { tokens: tokens.slice(interrogativo), pregunta: true },
  ];
}

function segmentar(texto: string): readonly Clausula[] {
  const segmentos = texto.normalize("NFC").toLowerCase().match(PATRON_CLAUSULA) ?? [];
  return segmentos.flatMap(clausulasDe);
}

function esPreterito(token: Token): boolean {
  return token.crudo.endsWith(SUFIJO_PRETERITO);
}

function esComplementoDeEnvio(token: Token): boolean {
  return (
    token.caso ||
    NEGACIONES.has(token.base) ||
    RELLENO.has(token.base) ||
    COMPLEMENTOS_DE_ENVIO.has(token.base)
  );
}

function cortaElComplemento(token: Token): boolean {
  return token.trasMotivo || CORTES_DE_COMPLEMENTO.has(token.base);
}

function colasDeComplemento(tokens: readonly Token[]): readonly boolean[] {
  const colas = new Array<boolean>(tokens.length + 1).fill(true);
  for (let indice = tokens.length - 1; indice >= 0; indice -= 1) {
    const token = tokens[indice];
    if (token === undefined) continue;
    colas[indice] = cortaElComplemento(token) || (esComplementoDeEnvio(token) && colas[indice + 1] === true);
  }
  return colas;
}

function saltarPronombres(tokens: readonly Token[], desde: number): number {
  let indice = desde;
  while (indice < tokens.length && PRONOMBRES_ATONOS.has(tokens[indice]?.base ?? "")) indice += 1;
  return indice;
}

function esVerboNegable(token: Token | undefined, verbos: readonly ReadonlySet<string>[]): boolean {
  if (token === undefined || esPreterito(token)) return false;
  return verbos.some((conjunto) => conjunto.has(token.base));
}

function niegaTrasModal(tokens: readonly Token[], desde: number, colas: readonly boolean[]): boolean {
  let indice = desde;
  if (ENLACES_MODALES.has(tokens[indice]?.base ?? "")) indice += 1;
  indice = saltarPronombres(tokens, indice);
  const verbos = [VERBOS_NEGABLES, VERBOS_GENERICOS_NEGABLES, INFINITIVOS_NEGABLES];
  return esVerboNegable(tokens[indice], verbos) && colas[indice + 1] === true;
}

function niegaDesde(tokens: readonly Token[], negador: number, colas: readonly boolean[]): boolean {
  const indice = saltarPronombres(tokens, negador + 1);
  const verbo = tokens[indice];
  if (verbo === undefined) return false;
  if (esVerboNegable(verbo, [VERBOS_NEGABLES])) return true;
  if (esVerboNegable(verbo, [VERBOS_GENERICOS_NEGABLES, INFINITIVOS_NEGABLES]))
    return colas[indice + 1] === true;
  if (MODALES_NEGABLES.has(verbo.base)) return niegaTrasModal(tokens, indice + 1, colas);
  return false;
}

function niegaElEnvio(tokens: readonly Token[], colas: readonly boolean[]): boolean {
  return tokens.some((token, indice) => NEGADORES.has(token.base) && niegaDesde(tokens, indice, colas));
}

function esCancelacion(tokens: readonly Token[], colas: readonly boolean[]): boolean {
  let prefijoDeComplementos = true;
  for (let indice = 0; indice < tokens.length && prefijoDeComplementos; indice += 1) {
    const token = tokens[indice];
    if (token === undefined) return false;
    if (CANCELACIONES.has(token.base) && colas[indice + 1] === true) return true;
    prefijoDeComplementos = esComplementoDeEnvio(token);
  }
  return false;
}

function rechazaLaClausula({ tokens }: Clausula): boolean {
  const colas = colasDeComplemento(tokens);
  return niegaElEnvio(tokens, colas) || esCancelacion(tokens, colas);
}

function esPalabraDeEspera(token: Token): boolean {
  return !token.caso && (NEGACIONES.has(token.base) || RELLENO_DE_ESPERA.has(token.base));
}

function esCasoPendiente(token: Token, pendientes: readonly string[]): boolean {
  return token.caso && pendientes.includes(token.crudo);
}

function nombraPendiente(tokens: readonly Token[], pendientes: readonly string[]): boolean {
  return tokens.some((token) => esCasoPendiente(token, pendientes));
}

function admiteEnEspera(pendientes: readonly string[], conRelleno: boolean): (token: Token) => boolean {
  return (token) =>
    esPalabraDeEspera(token) ||
    esCasoPendiente(token, pendientes) ||
    (conRelleno && !token.caso && RELLENO.has(token.base));
}

function abreContraposicion(tokens: readonly Token[], indice: number): boolean {
  const anterior = tokens[indice - 1];
  if (anterior === undefined || !NEGADORES.has(anterior.base)) return false;
  const previo = tokens[indice - 2];
  return previo === undefined || !esPalabraDeEspera(previo);
}

function tieneNucleo(tokens: readonly Token[]): boolean {
  return tokens.some((token) => NUCLEOS_DE_RECHAZO.has(token.base));
}

function esClausulaDeEspera(pendientes: readonly string[]): (clausula: Clausula) => boolean {
  return ({ tokens }) => {
    if (!tieneNucleo(tokens)) return false;
    const admitido = admiteEnEspera(pendientes, nombraPendiente(tokens, pendientes));
    return tokens.every(
      (token, indice) => esPalabraDeEspera(token) || (admitido(token) && !abreContraposicion(tokens, indice)),
    );
  };
}

function eximeLaEspera(pendientes: readonly string[]): (clausula: Clausula) => boolean {
  return ({ tokens }) => {
    const casos = tokens.filter((token) => token.caso);
    if (casos.some((token) => !pendientes.includes(token.crudo))) return true;
    return casos.length > 0 && VERBOS_DE_PEDIDO.has(tokens[0]?.base ?? "");
  };
}

function esEsperaCompleta(
  texto: string,
  clausulas: readonly Clausula[],
  pendientes: readonly string[],
): boolean {
  if (PATRON_PREGUNTA.test(texto)) return false;
  const tokens = clausulas.flatMap((clausula) => clausula.tokens);
  const conPendiente = nombraPendiente(tokens, pendientes);
  if (!tokens.every(admiteEnEspera(pendientes, conPendiente))) return false;
  if (!tokens.some((token) => NEGACIONES.has(token.base))) return false;
  return !conPendiente || tieneNucleo(tokens);
}

function esRechazoExplicito(texto: string, pendientes: readonly string[]): boolean {
  const clausulas = segmentar(texto);
  const afirmadas = clausulas.filter((clausula) => !clausula.pregunta);
  if (afirmadas.some(rechazaLaClausula)) return true;
  const exenta = afirmadas.some(eximeLaEspera(pendientes));
  if (!exenta && afirmadas.some(esClausulaDeEspera(pendientes))) return true;
  return esEsperaCompleta(texto, clausulas, pendientes);
}

export function clasificarConfirmacion(texto: string, pendientes: readonly string[]): DecisionConfirmacion {
  const normalizado = sinDiacriticos(texto).toLowerCase().trim();
  if (normalizado === "") return OTRO;
  if (esRechazoExplicito(texto, pendientes)) return RECHAZA;
  if (PATRON_PREGUNTA.test(texto)) return OTRO;
  const frase = separar(normalizado);
  if (!esConfirmacionClara(texto, frase)) return OTRO;
  return casoConfirmado(frase.slugs, pendientes);
}
