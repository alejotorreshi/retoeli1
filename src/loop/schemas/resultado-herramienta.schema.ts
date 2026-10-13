import { z } from "zod";

export const resultadoHerramientaSchema = z.object({
  ok: z.boolean(),
  codigo: z.string().optional(),
  resumen: z.string().optional(),
});

export const argumentosConCasoSchema = z.object({
  caso: z.string(),
});

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
});
