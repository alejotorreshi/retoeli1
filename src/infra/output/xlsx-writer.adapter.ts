import { type Cell, type Fill, Workbook, type Worksheet } from "exceljs";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { AUTOR_DOCUMENTOS } from "@/config/constants/runtime.constants.ts";
import { ANCHO_COLUMNA_XLSX, FORMATO_CELDA_TEXTO, RELLENO_XLSX } from "@/config/constants/xlsx.constants.ts";
import { TEXTO_XLSX } from "@/config/strings.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { FilaCelda } from "@/domain/types/formulario.type.ts";

type HojaEscrita = { readonly hoja: Worksheet; readonly largos: Map<number, number> };

function relleno(argb: string): Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function largoDeTexto(texto: string | null): number {
  return texto === null ? 0 : [...texto].length;
}

function anchoDeColumna(largo: number): number {
  const { minimo, maximo, margen } = ANCHO_COLUMNA_XLSX;
  return Math.min(maximo, Math.max(minimo, largo + margen));
}

function hojaPara(libro: Workbook, hojas: Map<string, HojaEscrita>, nombre: string): HojaEscrita {
  const existente = hojas.get(nombre);
  if (existente !== undefined) return existente;
  const nueva = { hoja: libro.addWorksheet(nombre), largos: new Map<number, number>() };
  hojas.set(nombre, nueva);
  return nueva;
}

function registrarTexto(largos: Map<number, number>, celda: Cell, texto: string | null): void {
  const columna = celda.fullAddress.col;
  largos.set(columna, Math.max(largos.get(columna) ?? 0, largoDeTexto(texto)));
}

function textoDelValor(fila: FilaCelda): string | null {
  return fila.estado === ESTADO_CAMPO.FALTANTE ? null : fila.valor;
}

function marcarValor(celda: Cell, fila: FilaCelda): void {
  celda.numFmt = FORMATO_CELDA_TEXTO;
  if (fila.estado === ESTADO_CAMPO.FALTANTE) {
    celda.value = null;
    celda.fill = relleno(RELLENO_XLSX.FALTANTE);
    celda.note = TEXTO_XLSX.notaFaltante;
    return;
  }
  celda.value = fila.valor;
  if (fila.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION) celda.fill = relleno(RELLENO_XLSX.POR_CONFIRMAR);
  if (fila.nota !== null) celda.note = fila.nota;
}

function escribirFila({ hoja, largos }: HojaEscrita, fila: FilaCelda): void {
  const etiqueta = hoja.getCell(fila.celda_etiqueta);
  etiqueta.value = fila.etiqueta;
  etiqueta.font = { bold: true };
  registrarTexto(largos, etiqueta, fila.etiqueta);
  const valor = hoja.getCell(fila.celda_valor);
  marcarValor(valor, fila);
  registrarTexto(largos, valor, textoDelValor(fila));
}

function aplicarAnchos({ hoja, largos }: HojaEscrita): void {
  const columnas = [...largos].sort(([a], [b]) => a - b);
  for (const [numero, largo] of columnas) hoja.getColumn(numero).width = anchoDeColumna(largo);
}

export async function writeXlsx(filas: readonly FilaCelda[], fecha: FechaISO): Promise<Uint8Array> {
  const libro = new Workbook();
  const instante = new Date(`${fecha}T00:00:00Z`);
  libro.creator = AUTOR_DOCUMENTOS;
  libro.lastModifiedBy = AUTOR_DOCUMENTOS;
  libro.created = instante;
  libro.modified = instante;
  const hojas = new Map<string, HojaEscrita>();
  for (const fila of filas) escribirFila(hojaPara(libro, hojas, fila.hoja), fila);
  for (const escrita of hojas.values()) aplicarAnchos(escrita);
  return new Uint8Array(await libro.xlsx.writeBuffer());
}
