import { z } from "zod";

export const resultadoHerramientaSchema = z.object({
  ok: z.boolean(),
  codigo: z.string().optional(),
  resumen: z.string().optional(),
});
