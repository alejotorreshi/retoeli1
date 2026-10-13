import { z } from "zod";
import {
  HOJA_RESERVADA_XLSX,
  LIMITES_FIXTURES,
  LIMITES_XLSX,
  NOMBRES_RESERVADOS_PAQUETE,
  PATRON_ARCHIVO_SOPORTE,
  PATRON_CELDA,
  PATRON_FECHA,
  PATRON_NOMBRE_HOJA,
  PATRON_PAIS,
  PATRON_RUTA_MAESTRO,
  PATRON_TIPO_SOPORTE,
} from "@/config/constantes.ts";
import { esFechaReal } from "@/config/env.ts";
import type { SoporteIndice } from "@/domain/checklist.ts";
import { FORMATOS } from "@/domain/tipos.ts";

const textoCorto = z.string().max(LIMITES_FIXTURES.textoCorto);
const etiqueta = z.string().min(1).max(LIMITES_FIXTURES.etiqueta);
const LETRAS_DEL_ALFABETO = 26;
const CODIGO_ANTES_DE_A = 64;

function numeroDeColumna(letras: string): number {
  return Array.from(letras).reduce(
    (total, letra) => total * LETRAS_DEL_ALFABETO + (letra.charCodeAt(0) - CODIGO_ANTES_DE_A),
    0,
  );
}

function celdaDentroDeLaHoja(direccion: string): boolean {
  const [, columna = "", fila = ""] = PATRON_CELDA.exec(direccion) ?? [];
  return numeroDeColumna(columna) <= LIMITES_XLSX.columnas && Number(fila) <= LIMITES_XLSX.filas;
}

const celda = z.string().regex(PATRON_CELDA).refine(celdaDentroDeLaHoja);

const hoja = z
  .string()
  .min(1)
  .max(LIMITES_XLSX.nombreHoja)
  .regex(PATRON_NOMBRE_HOJA)
  .refine((nombre) => nombre.toLowerCase() !== HOJA_RESERVADA_XLSX);

type UbicacionCelda = {
  readonly hoja: string;
  readonly celda_etiqueta: string;
  readonly celda_valor: string;
};

function hojasConUnaSolaGrafia(campos: readonly UbicacionCelda[]): boolean {
  const grafias = new Map<string, string>();
  return campos.every(({ hoja: nombre }) => {
    const previa = grafias.get(nombre.toLowerCase());
    grafias.set(nombre.toLowerCase(), nombre);
    return previa === undefined || previa === nombre;
  });
}

function celdasSinRepetir(campos: readonly UbicacionCelda[]): boolean {
  const ocupadas = campos.flatMap(({ hoja: nombre, celda_etiqueta, celda_valor }) =>
    [celda_etiqueta, celda_valor].map((direccion) => `${nombre.toLowerCase()}!${direccion}`),
  );
  return new Set(ocupadas).size === ocupadas.length;
}

export const esquemaSolicitud = z
  .object({
    id: textoCorto,
    de: textoCorto,
    para: textoCorto,
    asunto: textoCorto,
    fecha: z.string().regex(PATRON_FECHA),
    pais: z.string().regex(PATRON_PAIS),
    cliente: textoCorto,
    formato: z.enum(FORMATOS),
    cuerpo: z.string().max(LIMITES_FIXTURES.cuerpo),
    adjuntos: z.array(textoCorto).max(LIMITES_FIXTURES.adjuntos),
  })
  .strict();

export const esquemaPlantillaCeldas = z
  .array(
    z
      .object({
        hoja,
        celda_etiqueta: celda,
        etiqueta,
        celda_valor: celda,
      })
      .strict(),
  )
  .min(1)
  .max(LIMITES_FIXTURES.camposPlantilla)
  .refine(hojasConUnaSolaGrafia)
  .refine(celdasSinRepetir);

export const esquemaPlantillaCampos = z
  .array(z.object({ etiqueta, obligatorio: z.boolean() }).strict())
  .min(1)
  .max(LIMITES_FIXTURES.camposPlantilla);

export const esquemaSoportesExigidos = z
  .array(z.string().regex(PATRON_TIPO_SOPORTE))
  .max(LIMITES_FIXTURES.soportes);

const archivoSoporte = z
  .string()
  .regex(PATRON_ARCHIVO_SOPORTE)
  .refine((nombre) => !nombre.includes(".."))
  .refine((nombre) => !NOMBRES_RESERVADOS_PAQUETE.has(nombre));

export const esquemaIndiceSoportes = z
  .array(
    z
      .object({
        tipo: z.string().regex(PATRON_TIPO_SOPORTE),
        archivo: archivoSoporte,
        vigencia_hasta: z.string().regex(PATRON_FECHA).refine(esFechaReal).nullable(),
        pais_emisor: z.string().regex(PATRON_PAIS),
        descripcion: textoCorto,
      })
      .strict(),
  )
  .max(LIMITES_FIXTURES.soportes) satisfies z.ZodType<readonly SoporteIndice[]>;

export type ValorMaestro =
  | string
  | number
  | boolean
  | null
  | readonly ValorMaestro[]
  | { readonly [clave: string]: ValorMaestro };

const esquemaValorMaestro: z.ZodType<ValorMaestro> = z.lazy(() =>
  z.union([
    z.string().max(LIMITES_FIXTURES.textoMaestro),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(esquemaValorMaestro),
    z.record(z.string(), esquemaValorMaestro),
  ]),
);

export const esquemaMaestro = z.record(z.string(), esquemaValorMaestro);

export const esquemaGlosario = z.record(etiqueta, z.string().regex(PATRON_RUTA_MAESTRO));
