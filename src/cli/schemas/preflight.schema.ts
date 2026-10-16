import { z } from "zod";
import type {
  ArchivosGuion,
  ConfirmacionGuion,
  ErrorGuion,
  FinHerramientaGuion,
  FinTurnoGuion,
  InicioTurnoGuion,
  UsoTurnoGuion,
} from "@/cli/types/preflight.type.ts";
import { MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
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

export const archivosGuionSchema = z.object({
  archivos: z.array(z.object({ nombre: z.string() })),
}) satisfies z.ZodType<ArchivosGuion>;

export const inicioTurnoGuionSchema = z.object({
  sesionId: z.string(),
}) satisfies z.ZodType<InicioTurnoGuion>;

export const finHerramientaGuionSchema = z.object({
  herramienta: z.string(),
  caso: z.string().nullable(),
  ok: z.boolean(),
}) satisfies z.ZodType<FinHerramientaGuion>;

export const confirmacionGuionSchema = z.object({
  caso: z.string(),
  bloqueos: z.array(z.string()),
}) satisfies z.ZodType<ConfirmacionGuion>;

export const usoTurnoGuionSchema = z.object({
  entrada: z.number(),
  cacheHit: z.number(),
  salida: z.number(),
  totalSesion: z.number(),
}) satisfies z.ZodType<UsoTurnoGuion>;

export const errorGuionSchema = z.object({
  mensaje: z.string(),
}) satisfies z.ZodType<ErrorGuion>;

export const finTurnoGuionSchema = z.object({
  motivo: z.enum(MOTIVO_FIN),
  needsConfirmation: z.boolean(),
}) satisfies z.ZodType<FinTurnoGuion>;
