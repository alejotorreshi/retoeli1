import { z } from "zod";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type {
  ArgumentosConCaso,
  EnvioLeido,
  FormularioLeido,
  LecturaResultadoHerramienta,
  MapeoLeido,
  PaqueteArmadoLeido,
  PaqueteVisibleLeido,
  SolicitudLeida,
} from "@/loop/types/resultado-herramienta.type.ts";
import type { ConteoVisible, ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

export const resultadoHerramientaSchema = z.object({
  ok: z.boolean(),
  codigo: z.string().optional(),
  resumen: z.string().optional(),
}) satisfies z.ZodType<LecturaResultadoHerramienta>;

export const argumentosConCasoSchema = z.object({
  caso: z.string(),
}) satisfies z.ZodType<ArgumentosConCaso>;

const datosPaqueteSchema = z.object({
  bloqueos: z.array(z.string()),
  checklist: z.object({
    soportes: z.array(
      z.object({
        tipo: z.string(),
        estado: z.string(),
        vigencia_hasta: z.string().nullable(),
      }),
    ),
  }),
});

export const armarPaqueteSchema = z.object({
  ok: z.literal(true),
  data: datosPaqueteSchema,
}) satisfies z.ZodType<PaqueteArmadoLeido>;

export const paqueteVisibleSchema = z.object({
  ok: z.literal(true),
  data: datosPaqueteSchema.extend({ ruta: z.string(), listo_para_firma: z.boolean() }),
}) satisfies z.ZodType<PaqueteVisibleLeido>;

export const conteoVisibleSchema = z.object({
  [ESTADO_CAMPO.LLENO]: z.number(),
  [ESTADO_CAMPO.FALTANTE]: z.number(),
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: z.number(),
}) satisfies z.ZodType<ConteoVisible>;

const formatoSchema = z.enum(FORMATO);

export const solicitudLeidaSchema = z.object({
  ok: z.literal(true),
  data: z.object({ pais: z.string(), formato: formatoSchema }),
}) satisfies z.ZodType<SolicitudLeida>;

export const mapeoLeidoSchema = z.object({
  ok: z.literal(true),
  data: z.object({ pais: z.string(), conteo: conteoVisibleSchema }),
}) satisfies z.ZodType<MapeoLeido>;

export const formularioLeidoSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    ruta: z.string(),
    formato: formatoSchema,
    conteo: conteoVisibleSchema.optional(),
    aviso: z.string().nullable().optional(),
  }),
}) satisfies z.ZodType<FormularioLeido>;

export const envioLeidoSchema = z.object({
  ok: z.literal(true),
  data: z.object({ ruta: z.string() }),
}) satisfies z.ZodType<EnvioLeido>;

export const resultadoVisibleSchema = z.object({
  herramienta: z.enum(HERRAMIENTA),
  pais: z.string().nullable(),
  formato: formatoSchema.nullable(),
  conteo: conteoVisibleSchema.nullable(),
  listoParaFirma: z.boolean().nullable(),
  bloqueosLegibles: z.array(z.string()).nullable(),
  ruta: z.string().nullable(),
  aviso: z.string().nullable(),
}) satisfies z.ZodType<ResultadoVisible>;
