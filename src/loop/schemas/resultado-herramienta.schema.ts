import { z } from "zod";
import type {
  ArgumentosConCaso,
  LecturaResultadoHerramienta,
  PaqueteArmadoLeido,
} from "@/loop/types/resultado-herramienta.type.ts";

export const resultadoHerramientaSchema = z.object({
  ok: z.boolean(),
  codigo: z.string().optional(),
  resumen: z.string().optional(),
}) satisfies z.ZodType<LecturaResultadoHerramienta>;

export const argumentosConCasoSchema = z.object({
  caso: z.string(),
}) satisfies z.ZodType<ArgumentosConCaso>;

export const armarPaqueteSchema = z.object({
  ok: z.literal(true),
  data: z.object({
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
  }),
}) satisfies z.ZodType<PaqueteArmadoLeido>;
