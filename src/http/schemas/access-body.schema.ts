import { z } from "zod";
import { LONGITUD_MAXIMA_CODIGO_ACCESO } from "@/config/constants/http.constants.ts";
import type { AccessBody } from "@/http/types/api.type.ts";

export const accessBodySchema = z
  .object({
    codigo: z.string().trim().max(LONGITUD_MAXIMA_CODIGO_ACCESO),
  })
  .strict() satisfies z.ZodType<AccessBody>;
