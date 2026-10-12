import { z } from "zod";
import {
  FORMATOS,
  LIMITES_FIXTURES,
  PATRON_CELDA,
  PATRON_FECHA,
  PATRON_PAIS,
  PATRON_TIPO_SOPORTE,
} from "../../config/constantes.ts";

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
