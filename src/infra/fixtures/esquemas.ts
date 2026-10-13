import { z } from "zod";
import { NOMBRES_RESERVADOS_PAQUETE } from "@/config/constants/files.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { LIMITES_FIXTURES } from "@/config/constants/limits.constants.ts";
import {
  PATRON_ARCHIVO_SOPORTE,
  PATRON_CELDA,
  PATRON_FECHA,
  PATRON_NOMBRE_HOJA,
  PATRON_PAIS,
  PATRON_RUTA_MAESTRO,
  PATRON_TIPO_SOPORTE,
} from "@/config/constants/patterns.constants.ts";
import {
  CODIGO_ANTES_DE_A,
  HOJA_RESERVADA_XLSX,
  LETRAS_DEL_ALFABETO,
  LIMITES_XLSX,
} from "@/config/constants/xlsx.constants.ts";
import { esFechaReal } from "@/domain/fecha.ts";
import type { SoporteIndice } from "@/domain/types/checklist.type.ts";
import type { Maestro, ValorMaestro } from "@/domain/types/maestro.type.ts";
import type { Glosario } from "@/domain/types/mapeo.type.ts";
import type { Solicitud } from "@/domain/types/solicitud.type.ts";

const textoCorto = z.string().max(LIMITES_FIXTURES.textoCorto);
const etiqueta = z.string().min(1).max(LIMITES_FIXTURES.etiqueta);

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
    formato: z.enum(FORMATO),
    cuerpo: z.string().max(LIMITES_FIXTURES.cuerpo),
    adjuntos: z.array(textoCorto).max(LIMITES_FIXTURES.adjuntos),
  })
  .strict() satisfies z.ZodType<Solicitud>;

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

export const esquemaMaestro = z.record(z.string(), esquemaValorMaestro) satisfies z.ZodType<Maestro>;

export const esquemaGlosario = z.record(
  etiqueta,
  z.string().regex(PATRON_RUTA_MAESTRO),
) satisfies z.ZodType<Glosario>;
