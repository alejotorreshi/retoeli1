import { z } from "zod";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { LONGITUD_MAXIMA_CASO, LONGITUD_MAXIMA_SESION } from "@/config/constants/limits.constants.ts";
import type { ChatBody } from "@/http/types/api.type.ts";

export const chatBodySchema = z
  .object({
    sessionId: z.string().max(LONGITUD_MAXIMA_SESION).nullable(),
    message: z.string().trim().min(1),
    accion: z
      .object({
        tipo: z.enum(TIPO_ACCION),
        caso: z.string().max(LONGITUD_MAXIMA_CASO),
      })
      .strict()
      .optional(),
  })
  .strict() satisfies z.ZodType<ChatBody>;
