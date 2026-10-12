import { z } from "zod";
import {
  FORMATOS,
  LIMITES_FIXTURES,
  NOMBRES_RESERVADOS_PAQUETE,
  PATRON_ARCHIVO_SOPORTE,
  PATRON_CELDA,
  PATRON_FECHA,
  PATRON_PAIS,
  PATRON_RUTA_MAESTRO,
  PATRON_TIPO_SOPORTE,
} from "../../config/constantes.ts";
import { esFechaReal } from "../../config/env.ts";
import type { SoporteIndice } from "../../domain/checklist.ts";

const textoCorto = z.string().max(LIMITES_FIXTURES.textoCorto);
const etiqueta = z.string().min(1).max(LIMITES_FIXTURES.etiqueta);
const celda = z.string().regex(PATRON_CELDA);

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
        hoja: textoCorto,
        celda_etiqueta: celda,
        etiqueta,
        celda_valor: celda,
      })
      .strict(),
  )
  .min(1)
  .max(LIMITES_FIXTURES.camposPlantilla);

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
