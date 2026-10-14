import { z } from "zod";
import { LONGITUD_MAXIMA_SESION } from "@/config/constants/limits.constants.ts";
import type { ChatBody } from "@/http/types/api.type.ts";

export const chatBodySchema = z
  .object({
    sessionId: z.string().max(LONGITUD_MAXIMA_SESION).nullable(),
    message: z.string().trim().min(1),
  })
  .strict() satisfies z.ZodType<ChatBody>;
