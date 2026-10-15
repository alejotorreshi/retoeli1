import { z } from "zod";
import { resultadoVisibleSchema } from "@/loop/schemas/resultado-herramienta.schema.ts";
import type {
  HerramientaVista,
  PendienteVista,
  TurnoVista,
  VistaSesion,
} from "@/loop/types/vista-sesion.type.ts";

export const herramientaVistaSchema = z.object({
  llamadaId: z.string(),
  herramienta: z.string(),
  caso: z.string().nullable(),
  argumentos: z.unknown(),
  ok: z.boolean(),
  codigo: z.string().nullable(),
  resumen: z.string().nullable(),
  resultado: resultadoVisibleSchema.nullable(),
}) satisfies z.ZodType<HerramientaVista>;

export const turnoVistaSchema = z.object({
  mensaje: z.string(),
  herramientas: z.array(herramientaVistaSchema),
  texto: z.string().nullable(),
}) satisfies z.ZodType<TurnoVista>;

export const pendienteVistaSchema = z.object({
  caso: z.string(),
  bloqueos: z.array(z.string()),
  bloqueosLegibles: z.array(z.string()),
}) satisfies z.ZodType<PendienteVista>;

export const vistaSesionSchema = z.object({
  sesionId: z.string(),
  turnos: z.array(turnoVistaSchema),
  pendientes: z.array(pendienteVistaSchema),
  casosEnviados: z.array(z.string()),
  tokensUsados: z.number(),
  ocupada: z.boolean(),
}) satisfies z.ZodType<VistaSesion>;
