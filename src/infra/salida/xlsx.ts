import { type Cell, type Fill, Workbook, type Worksheet } from "exceljs";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { AUTOR_DOCUMENTOS } from "@/config/constants/runtime.constants.ts";
import { FORMATO_CELDA_TEXTO, MARCAS_XLSX, RELLENO_XLSX } from "@/config/constants/xlsx.constants.ts";
import type { FilaCelda } from "@/domain/formulario.ts";
import type { FechaISO } from "@/domain/tipos.ts";

function relleno(argb: string): Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function hojaPara(libro: Workbook, hojas: Map<string, Worksheet>, nombre: string): Worksheet {
  const existente = hojas.get(nombre);
  if (existente !== undefined) return existente;
  const nueva = libro.addWorksheet(nombre);
  hojas.set(nombre, nueva);
  return nueva;
}

function marcarValor(celda: Cell, fila: FilaCelda): void {
  celda.numFmt = FORMATO_CELDA_TEXTO;
  if (fila.estado === ESTADO_CAMPO.FALTANTE) {
    celda.value = null;
    celda.fill = relleno(RELLENO_XLSX.FALTANTE);
    celda.note = MARCAS_XLSX.notaFaltante;
    return;
  }
  celda.value = fila.valor;
  if (fila.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION) celda.fill = relleno(RELLENO_XLSX.POR_CONFIRMAR);
  if (fila.nota !== null) celda.note = fila.nota;
}

function escribirFila(hoja: Worksheet, fila: FilaCelda): void {
  const etiqueta = hoja.getCell(fila.celda_etiqueta);
  etiqueta.value = fila.etiqueta;
  etiqueta.font = { bold: true };
  marcarValor(hoja.getCell(fila.celda_valor), fila);
}

export async function escribirXlsx(filas: readonly FilaCelda[], fecha: FechaISO): Promise<Uint8Array> {
  const libro = new Workbook();
  const instante = new Date(`${fecha}T00:00:00Z`);
  libro.creator = AUTOR_DOCUMENTOS;
  libro.lastModifiedBy = AUTOR_DOCUMENTOS;
  libro.created = instante;
  libro.modified = instante;
  const hojas = new Map<string, Worksheet>();
  for (const fila of filas) escribirFila(hojaPara(libro, hojas, fila.hoja), fila);
  return new Uint8Array(await libro.xlsx.writeBuffer());
}
