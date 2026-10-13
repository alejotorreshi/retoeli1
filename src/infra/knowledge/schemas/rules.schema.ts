import { z } from "zod";
import { CLAVE_PLANTILLA, VERSION_REGLAS } from "@/config/constants/knowledge.constants.ts";
import { LIMITES_REGLAS } from "@/config/constants/limits.constants.ts";
import { APLICA_NOTA, REGLA_MAPEO } from "@/config/constants/mapping.constants.ts";
import {
  PATRON_PAIS,
  PATRON_PLANTILLA_CONOCIMIENTO,
  PATRON_RUTA_MAESTRO,
  PATRON_TEXTO_NO_VACIO,
} from "@/config/constants/patterns.constants.ts";
import type { ClavePlantilla, ReglaMapeo, Reglas } from "@/domain/types/reglas.type.ts";

const confianza = z.number().min(0).max(1);
const texto = z.string().max(LIMITES_REGLAS.texto).regex(PATRON_TEXTO_NO_VACIO);
const rutaMaestro = z.string().regex(PATRON_RUTA_MAESTRO);
const pais = z.string().regex(PATRON_PAIS);
const plantilla = z.string().regex(PATRON_PLANTILLA_CONOCIMIENTO);

const confianzaPorRegla = {
  [REGLA_MAPEO.GLOSARIO_EXACTO]: confianza,
  [REGLA_MAPEO.GLOSARIO_NORMALIZADO]: confianza,
  [REGLA_MAPEO.CLAVE_DIRECTA]: confianza,
  [REGLA_MAPEO.REGLA_PAIS]: confianza,
  [REGLA_MAPEO.ETIQUETA_GENERICA]: confianza,
  [REGLA_MAPEO.SIN_FUENTE]: confianza,
} satisfies Record<ReglaMapeo, typeof confianza>;

const plantillaPorClave = {
  [CLAVE_PLANTILLA.CHECKLIST]: plantilla,
  [CLAVE_PLANTILLA.BORRADOR_CORREO]: plantilla,
  [CLAVE_PLANTILLA.ENVIO_SIMULADO]: plantilla,
  [CLAVE_PLANTILLA.VALORES_PORTAL]: plantilla,
} satisfies Record<ClavePlantilla, typeof plantilla>;

export const esquemaReglas = z
  .object({
    version: z.literal(VERSION_REGLAS),
    confianza: z.object({ umbral: z.number().gt(0).max(1), ...confianzaPorRegla }).strict(),
    identificador_tributario: z
      .object({
        ruta: rutaMaestro,
        pais_origen: pais,
        por_pais: z.record(pais, z.string().max(LIMITES_REGLAS.identificador).regex(PATRON_TEXTO_NO_VACIO)),
        nota_extranjero: texto,
        nota_generica: texto,
      })
      .strict(),
    etiquetas_genericas: z
      .array(z.string().max(LIMITES_REGLAS.etiqueta).regex(PATRON_TEXTO_NO_VACIO))
      .max(LIMITES_REGLAS.elementos),
    notas_contexto: z
      .array(z.object({ ruta: rutaMaestro, aplica: z.enum(APLICA_NOTA), texto }).strict())
      .max(LIMITES_REGLAS.elementos),
    soportes: z
      .object({
        dias_aviso_vencimiento: z.number().int().min(0).max(LIMITES_REGLAS.diasAvisoMaximo),
        aviso_emisor_distinto: texto,
      })
      .strict(),
    plantillas: z.object(plantillaPorClave).strict(),
  })
  .strict() satisfies z.ZodType<Reglas>;
