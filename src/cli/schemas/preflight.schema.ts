import { z } from "zod";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ConfigResponse, HealthResponse } from "@/http/types/api.type.ts";

export const saludSchema = z.object({
  ok: z.literal(true),
  provider: z.string(),
  model: z.string(),
  llm: z.enum(ESTADO_LLM),
}) satisfies z.ZodType<HealthResponse>;

export const configSchema = z.object({
  fechaEjecucion: z.string(),
  zona: z.string(),
  casos: z.array(z.string()),
  presupuestoSesion: z.number(),
  mensajeMaximo: z.number(),
}) satisfies z.ZodType<ConfigResponse>;
