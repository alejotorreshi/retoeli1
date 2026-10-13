import { readFile } from "node:fs/promises";
import type { CeldaLeida, MetadatosXlsx, TipoCelda } from "@tests/helpers/types/xlsx-leer.type.ts";
import { type Cell, ValueType, Workbook } from "exceljs";

const TIPOS: ReadonlyMap<ValueType, TipoCelda> = new Map([
  [ValueType.Null, "vacia"],
  [ValueType.String, "texto"],
  [ValueType.SharedString, "texto"],
  [ValueType.Number, "numero"],
  [ValueType.Formula, "formula"],
]);

async function cargar(ruta: string): Promise<Workbook> {
  const bytes = await readFile(ruta);
  const libro = new Workbook();
  await libro.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  return libro;
}

function rellenoDe(celda: Cell): string | null {
  const relleno = celda.fill;
  if (relleno === undefined || relleno.type !== "pattern" || relleno.pattern !== "solid") return null;
  return relleno.fgColor?.argb ?? null;
}

function notaDe(celda: Cell): string | null {
  const nota: unknown = celda.note;
  return typeof nota === "string" ? nota : null;
}

function leerCelda(hoja: string, celda: Cell): CeldaLeida {
  return {
    hoja,
    celda: celda.address,
    valor: celda.value,
    tipo: TIPOS.get(celda.type) ?? "otro",
    formato: celda.numFmt ?? null,
    relleno: rellenoDe(celda),
    nota: notaDe(celda),
    negrita: celda.font?.bold === true,
  };
}

function relevante(celda: CeldaLeida): boolean {
  return celda.valor !== null || celda.relleno !== null || celda.nota !== null;
}

export async function leerCeldasXlsx(ruta: string): Promise<CeldaLeida[]> {
  const libro = await cargar(ruta);
  const celdas: CeldaLeida[] = [];
  libro.eachSheet((hoja) => {
    hoja.eachRow({ includeEmpty: true }, (fila) => {
      fila.eachCell({ includeEmpty: true }, (celda) => {
        const leida = leerCelda(hoja.name, celda);
        if (relevante(leida)) celdas.push(leida);
      });
    });
  });
  return celdas;
}

export async function leerMetadatosXlsx(ruta: string): Promise<MetadatosXlsx> {
  const libro = await cargar(ruta);
  return {
    hojas: libro.worksheets.map((hoja) => hoja.name),
    creador: libro.creator,
    modificadoPor: libro.lastModifiedBy,
    creado: libro.created.toISOString(),
    modificado: libro.modified.toISOString(),
  };
}

export function celdaEn(celdas: readonly CeldaLeida[], hoja: string, direccion: string): CeldaLeida {
  const encontrada = celdas.find((celda) => celda.hoja === hoja && celda.celda === direccion);
  if (encontrada === undefined) throw new Error(`sin celda ${hoja}!${direccion}`);
  return encontrada;
}
