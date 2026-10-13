import type { EntradaFormularioPdf } from "@/application/puertos.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { PATRON_ESPACIOS } from "@/config/constants/patterns.constants.ts";
import { COLOR_TRAZO, DISENO_PDF } from "@/config/constants/pdf.constants.ts";
import { TEXTO_COMUN, TEXTO_PDF } from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { FilaFormulario } from "@/domain/types/formulario.type.ts";

export type ColorTrazo = ValorDe<typeof COLOR_TRAZO>;

export type LineaPdf = {
  readonly x: number;
  readonly y: number;
  readonly texto: string;
  readonly tamano: number;
  readonly negrita: boolean;
  readonly color: ColorTrazo;
};

export type Pagina = { readonly lineas: readonly LineaPdf[] };

export type Medir = (texto: string, tamano: number, negrita: boolean) => number;

export type EntradaLayoutPdf = EntradaFormularioPdf & { readonly fecha: FechaISO };

type Estilo = { readonly tamano: number; readonly negrita: boolean; readonly color: ColorTrazo };

type Trozo = { readonly texto: string; readonly estilo: Estilo };

type Lienzo = { readonly paginas: LineaPdf[][]; y: number };

const X_ETIQUETA = DISENO_PDF.margen;
const X_VALOR = DISENO_PDF.margen + DISENO_PDF.anchoEtiqueta + DISENO_PDF.separacionColumnas;
const ANCHO_VALOR = DISENO_PDF.ancho - DISENO_PDF.margen - X_VALOR;
const ANCHO_COMPLETO = DISENO_PDF.ancho - 2 * DISENO_PDF.margen;
const Y_INICIAL = DISENO_PDF.alto - DISENO_PDF.margen - DISENO_PDF.tamanoTitulo;
const FILAS_POR_PAGINA = Math.floor((Y_INICIAL - DISENO_PDF.margen) / DISENO_PDF.interlineado) + 1;

const TITULO: Estilo = { tamano: DISENO_PDF.tamanoTitulo, negrita: true, color: COLOR_TRAZO.TEXTO };
const ETIQUETA: Estilo = { tamano: DISENO_PDF.tamanoTexto, negrita: true, color: COLOR_TRAZO.TEXTO };
const TEXTO: Estilo = { tamano: DISENO_PDF.tamanoTexto, negrita: false, color: COLOR_TRAZO.TEXTO };
const FALTANTE: Estilo = { ...TEXTO, color: COLOR_TRAZO.FALTANTE };
const POR_CONFIRMAR: Estilo = { ...TEXTO, color: COLOR_TRAZO.POR_CONFIRMAR };

function partirPalabra(palabra: string, ancho: number, estilo: Estilo, medir: Medir): string[] {
  const trozos: string[] = [];
  let actual = "";
  for (const caracter of Array.from(palabra)) {
    const candidato = actual + caracter;
    if (actual !== "" && medir(candidato, estilo.tamano, estilo.negrita) > ancho) {
      trozos.push(actual);
      actual = caracter;
    } else {
      actual = candidato;
    }
  }
  if (actual !== "") trozos.push(actual);
  return trozos;
}

function envolver(texto: string, ancho: number, estilo: Estilo, medir: Medir): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.normalize("NFC").split(PATRON_ESPACIOS)) {
    if (palabra === "") continue;
    const candidata = actual === "" ? palabra : `${actual} ${palabra}`;
    if (medir(candidata, estilo.tamano, estilo.negrita) <= ancho) {
      actual = candidata;
      continue;
    }
    if (actual !== "") lineas.push(actual);
    const trozos = partirPalabra(palabra, ancho, estilo, medir);
    actual = trozos.pop() ?? "";
    lineas.push(...trozos);
  }
  if (actual !== "") lineas.push(actual);
  return lineas;
}

function trozos(textos: readonly string[], estilo: Estilo): Trozo[] {
  return textos.map((texto) => ({ texto, estilo }));
}

function conMarca(valor: string, marca: string, medir: Medir): string[] {
  const lineas = envolver(valor, ANCHO_VALOR, POR_CONFIRMAR, medir);
  const ultima = lineas.pop();
  if (ultima === undefined) return [marca];
  const unida = `${ultima} ${marca}`;
  const cabe = medir(unida, POR_CONFIRMAR.tamano, POR_CONFIRMAR.negrita) <= ANCHO_VALOR;
  return cabe ? [...lineas, unida] : [...lineas, ultima, marca];
}

function trozosDeValor(fila: FilaFormulario, medir: Medir): Trozo[] {
  if (fila.estado === ESTADO_CAMPO.FALTANTE) return trozos([TEXTO_PDF.faltante], FALTANTE);
  const valor = fila.valor ?? "";
  if (fila.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION) {
    return trozos(conMarca(valor, TEXTO_PDF.porConfirmar, medir), POR_CONFIRMAR);
  }
  return trozos(envolver(valor, ANCHO_VALOR, TEXTO, medir), TEXTO);
}

function etiquetaDe(fila: FilaFormulario): string {
  return fila.obligatorio === true ? `${fila.etiqueta}${TEXTO_PDF.obligatorio}` : fila.etiqueta;
}

function motivoDe(fila: FilaFormulario): string | null {
  if (fila.estado === ESTADO_CAMPO.FALTANTE) {
    return fila.nota === null
      ? TEXTO_PDF.motivoFaltante
      : `${TEXTO_PDF.motivoFaltante}${TEXTO_COMUN.separadorNotas}${fila.nota}`;
  }
  if (fila.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION) return fila.nota ?? TEXTO_PDF.motivoPorConfirmar;
  return fila.nota;
}

function nuevaPagina(lienzo: Lienzo): void {
  lienzo.paginas.push([]);
  lienzo.y = Y_INICIAL;
}

function reservar(lienzo: Lienzo, filas: number): void {
  const enPaginaNueva = lienzo.y === Y_INICIAL;
  const cabe = lienzo.y - (filas - 1) * DISENO_PDF.interlineado >= DISENO_PDF.margen;
  if (!cabe && !enPaginaNueva && filas <= FILAS_POR_PAGINA) nuevaPagina(lienzo);
}

function trazar(lienzo: Lienzo, x: number, trozo: Trozo): void {
  const pagina = lienzo.paginas[lienzo.paginas.length - 1];
  pagina?.push({ x, y: lienzo.y, texto: trozo.texto, ...trozo.estilo });
}

function avanzar(lienzo: Lienzo, espacio: number): void {
  lienzo.y -= espacio;
}

function columnas(lienzo: Lienzo, izquierda: readonly Trozo[], derecha: readonly Trozo[]): void {
  const filas = Math.max(izquierda.length, derecha.length, 1);
  reservar(lienzo, filas);
  for (let indice = 0; indice < filas; indice += 1) {
    if (lienzo.y < DISENO_PDF.margen) nuevaPagina(lienzo);
    const etiqueta = izquierda[indice];
    const valor = derecha[indice];
    if (etiqueta !== undefined) trazar(lienzo, X_ETIQUETA, etiqueta);
    if (valor !== undefined) trazar(lienzo, X_VALOR, valor);
    avanzar(lienzo, DISENO_PDF.interlineado);
  }
}

function parrafo(lienzo: Lienzo, texto: string, estilo: Estilo, medir: Medir): void {
  columnas(lienzo, trozos(envolver(texto, ANCHO_COMPLETO, estilo, medir), estilo), []);
}

function encabezado(lienzo: Lienzo, entrada: EntradaLayoutPdf, medir: Medir): void {
  parrafo(lienzo, TEXTO_PDF.titulo, TITULO, medir);
  parrafo(lienzo, `${TEXTO_PDF.caso}${entrada.caso}`, TEXTO, medir);
  parrafo(lienzo, `${TEXTO_PDF.cliente}${entrada.cliente}`, TEXTO, medir);
  parrafo(lienzo, `${TEXTO_PDF.fecha}${entrada.fecha}`, TEXTO, medir);
  avanzar(lienzo, DISENO_PDF.interlineado);
}

function campos(lienzo: Lienzo, filas: readonly FilaFormulario[], medir: Medir): void {
  for (const fila of filas) {
    const etiqueta = trozos(envolver(etiquetaDe(fila), DISENO_PDF.anchoEtiqueta, ETIQUETA, medir), ETIQUETA);
    columnas(lienzo, etiqueta, trozosDeValor(fila, medir));
    avanzar(lienzo, DISENO_PDF.separacionBloques);
  }
}

function notas(lienzo: Lienzo, filas: readonly FilaFormulario[], medir: Medir): void {
  avanzar(lienzo, DISENO_PDF.interlineado);
  reservar(lienzo, 2);
  parrafo(lienzo, TEXTO_PDF.notas, TITULO, medir);
  const lineas = filas.flatMap((fila) => {
    const motivo = motivoDe(fila);
    return motivo === null ? [] : [`${fila.etiqueta}: ${motivo}`];
  });
  if (lineas.length === 0) parrafo(lienzo, TEXTO_PDF.sinNotas, TEXTO, medir);
  for (const linea of lineas) parrafo(lienzo, linea, TEXTO, medir);
}

export function componerPdf(entrada: EntradaLayoutPdf, medir: Medir): Pagina[] {
  const lienzo: Lienzo = { paginas: [[]], y: Y_INICIAL };
  encabezado(lienzo, entrada, medir);
  campos(lienzo, entrada.filas, medir);
  notas(lienzo, entrada.filas, medir);
  return lienzo.paginas.map((lineas) => ({ lineas }));
}
