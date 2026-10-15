import { z } from "zod";
import {
  DEADLINE_TURNO_MS_POR_DEFECTO,
  MAX_ITERACIONES_POR_DEFECTO,
  MAX_ITERACIONES_TOPE,
  MAX_SESIONES_POR_DEFECTO,
  PRESUPUESTO_TOKENS_SESION_POR_DEFECTO,
  TTL_SESION_MINUTOS_POR_DEFECTO,
} from "@/config/constants/agent.constants.ts";
import {
  ENTORNO_APP,
  LONGITUD_MAXIMA_CODIGO_ACCESO,
  LONGITUD_MINIMA_CODIGO_ACCESO,
  LONGITUD_MINIMA_SECRETO_TOKEN,
  PUERTO_API_POR_DEFECTO,
  PUERTO_MAXIMO,
  VARIABLE_SECRETO_TOKEN,
  VIGENCIA_ACCESO_HORAS_POR_DEFECTO,
  VIGENCIA_ACCESO_HORAS_TOPE,
} from "@/config/constants/http.constants.ts";
import {
  BOOLEANO_ENV,
  CAPACIDADES_GENERICAS,
  HOSTS_LOOPBACK,
  MAX_TOKENS_SALIDA_POR_DEFECTO,
  MAX_TOKENS_SALIDA_TOPE,
  MODO_THINKING,
  PARAMETRO_MAX_TOKENS,
  PRESET_DEEPSEEK,
  PRESETS_PROVEEDOR,
  PROTOCOLO_LOOPBACK,
  PROTOCOLO_SEGURO,
  PROVEEDOR_DEEPSEEK,
  REINTENTOS_LLM_POR_DEFECTO,
  REINTENTOS_LLM_TOPE,
  TEMPERATURA_MAXIMA,
  TIMEOUT_LLM_MS_POR_DEFECTO,
  VALOR_OMITIR,
} from "@/config/constants/llm.constants.ts";
import { NIVEL_LOG_POR_DEFECTO, NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { PATRON_BARRA_FINAL, PATRON_FECHA } from "@/config/constants/patterns.constants.ts";
import { LOCALE_INTL, ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import { TEXTO_ENV } from "@/config/strings.ts";
import type {
  MaxTokensParam,
  ProviderCapabilities,
  ProviderEndpoint,
  ThinkingMode,
} from "@/config/types/provider-capabilities.type.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { esFechaReal } from "@/domain/utils/fecha.util.ts";

function emptyAsUndefined(valor: unknown): unknown {
  return valor === "" ? undefined : valor;
}

function isTimeZone(zona: string): boolean {
  try {
    return new Intl.DateTimeFormat(LOCALE_INTL, { timeZone: zona }).resolvedOptions().timeZone !== "";
  } catch {
    return false;
  }
}

const toolEnvSchema = z.object({
  FECHA_EJECUCION: z.preprocess(
    emptyAsUndefined,
    z
      .string()
      .regex(PATRON_FECHA, TEXTO_ENV.formatoFecha)
      .refine(esFechaReal, TEXTO_ENV.fechaInexistente)
      .optional(),
  ),
  TZ_NEGOCIO: z.preprocess(
    emptyAsUndefined,
    z.string().refine(isTimeZone, TEXTO_ENV.zonaHorariaInvalida).default(ZONA_HORARIA_POR_DEFECTO),
  ),
});

export type ToolEnv = z.output<typeof toolEnvSchema>;

export type EnvSource = Readonly<Record<string, string | undefined>>;

function parseToolEnv(source: EnvSource) {
  return toolEnvSchema.safeParse(source, { error: z.locales.es().localeError });
}

export function readToolEnv() {
  return parseToolEnv(process.env);
}

export function pinExecutionDate(fecha: string): () => void {
  const previous = process.env.FECHA_EJECUCION;
  process.env.FECHA_EJECUCION = fecha;
  return () => {
    if (previous === undefined) delete process.env.FECHA_EJECUCION;
    else process.env.FECHA_EJECUCION = previous;
  };
}

export type ProviderSettings = ProviderEndpoint & { readonly apiKey: string | null };

export type AgentEnv = {
  readonly primary: ProviderSettings;
  readonly fallback: ProviderSettings | null;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly turnDeadlineMs: number;
  readonly maxIterations: number;
  readonly sessionTokenBudget: number;
  readonly sessionTtlMinutes: number;
  readonly maxSessions: number;
  readonly logLevel: ValorDe<typeof NIVELES_LOG>;
};

type ProviderPreset = ValorDe<typeof PRESETS_PROVEEDOR>;

function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(emptyAsUndefined, schema.optional());
}

function withDefault<O>(schema: z.ZodType<O>, valor: O) {
  return z.preprocess(
    emptyAsUndefined,
    schema.optional().transform((leido) => leido ?? valor),
  );
}

function parsesAsUrl(valor: string): boolean {
  return URL.canParse(valor);
}

function isAllowedProtocol(valor: string): boolean {
  const url = new URL(valor);
  return (
    url.protocol === PROTOCOLO_SEGURO ||
    (url.protocol === PROTOCOLO_LOOPBACK && HOSTS_LOOPBACK.has(url.hostname))
  );
}

const providerUrl = z
  .string()
  .trim()
  .refine(parsesAsUrl, { message: TEXTO_ENV.urlInvalida, abort: true })
  .refine(isAllowedProtocol, TEXTO_ENV.urlNoSegura)
  .transform((valor) => valor.replace(PATRON_BARRA_FINAL, ""));

const text = z.string().trim().min(1);

const flag = z.enum(BOOLEANO_ENV).transform((valor) => valor === BOOLEANO_ENV.VERDADERO);

const temperature = z.union([z.literal(VALOR_OMITIR), z.coerce.number().min(0).max(TEMPERATURA_MAXIMA)]);

const thinking = z.enum([...Object.values(MODO_THINKING), VALOR_OMITIR]);

function positiveInt(maximo?: number) {
  const base = z.coerce.number().int().positive();
  return maximo === undefined ? base : base.max(maximo);
}

const capabilityFields = {
  maxTokensParam: optional(z.enum(PARAMETRO_MAX_TOKENS)),
  temperature: optional(temperature),
  thinking: optional(thinking),
  reasoningPassback: optional(flag),
  toolChoiceNone: optional(flag),
};

const agentEnvSchema = z.object({
  LLM_PROVIDER: withDefault(z.string().trim().toLowerCase(), PROVEEDOR_DEEPSEEK),
  LLM_BASE_URL: optional(providerUrl),
  LLM_MODEL: optional(text),
  LLM_API_KEY: optional(text),
  DEEPSEEK_API_KEY: optional(text),
  LLM_MAX_OUTPUT_TOKENS: withDefault(positiveInt(MAX_TOKENS_SALIDA_TOPE), MAX_TOKENS_SALIDA_POR_DEFECTO),
  LLM_MAX_TOKENS_PARAM: capabilityFields.maxTokensParam,
  LLM_TEMPERATURE: capabilityFields.temperature,
  LLM_THINKING: capabilityFields.thinking,
  LLM_REASONING_PASSBACK: capabilityFields.reasoningPassback,
  LLM_TOOL_CHOICE_NONE: capabilityFields.toolChoiceNone,
  LLM_FALLBACK_ENABLED: withDefault(flag, true),
  LLM_FALLBACK_PROVIDER: optional(z.string().trim().toLowerCase()),
  LLM_FALLBACK_BASE_URL: optional(providerUrl),
  LLM_FALLBACK_MODEL: optional(text),
  LLM_FALLBACK_API_KEY: optional(text),
  LLM_FALLBACK_MAX_TOKENS_PARAM: capabilityFields.maxTokensParam,
  LLM_FALLBACK_TEMPERATURE: capabilityFields.temperature,
  LLM_FALLBACK_THINKING: capabilityFields.thinking,
  LLM_FALLBACK_REASONING_PASSBACK: capabilityFields.reasoningPassback,
  LLM_FALLBACK_TOOL_CHOICE_NONE: capabilityFields.toolChoiceNone,
  LLM_TIMEOUT_MS: withDefault(positiveInt(), TIMEOUT_LLM_MS_POR_DEFECTO),
  LLM_MAX_RETRIES: withDefault(
    z.coerce.number().int().min(0).max(REINTENTOS_LLM_TOPE),
    REINTENTOS_LLM_POR_DEFECTO,
  ),
  AGENT_TURN_DEADLINE_MS: withDefault(positiveInt(), DEADLINE_TURNO_MS_POR_DEFECTO),
  AGENT_MAX_ITERATIONS: withDefault(positiveInt(MAX_ITERACIONES_TOPE), MAX_ITERACIONES_POR_DEFECTO),
  AGENT_SESSION_TOKEN_BUDGET: withDefault(positiveInt(), PRESUPUESTO_TOKENS_SESION_POR_DEFECTO),
  AGENT_SESSION_TTL_MINUTES: withDefault(positiveInt(), TTL_SESION_MINUTOS_POR_DEFECTO),
  AGENT_MAX_SESSIONS: withDefault(positiveInt(), MAX_SESIONES_POR_DEFECTO),
  LOG_LEVEL: withDefault(z.enum(NIVELES_LOG), NIVEL_LOG_POR_DEFECTO),
});

type AgentEnvInput = z.output<typeof agentEnvSchema>;

type CapabilityInput = {
  readonly maxTokensParam: MaxTokensParam | undefined;
  readonly temperature: number | typeof VALOR_OMITIR | undefined;
  readonly thinking: ThinkingMode | typeof VALOR_OMITIR | undefined;
  readonly reasoningPassback: boolean | undefined;
  readonly toolChoiceNone: boolean | undefined;
};

type KeySources = {
  readonly explicit: string | undefined;
  readonly inherited: { readonly baseUrl: string; readonly apiKey: string | null } | null;
  readonly deepseekAlias: string | undefined;
};

function presetOf(provider: string): ProviderPreset | null {
  const presets: Readonly<Record<string, ProviderPreset>> = PRESETS_PROVEEDOR;
  return Object.hasOwn(presets, provider) ? (presets[provider] ?? null) : null;
}

function omittable<T>(valor: T | typeof VALOR_OMITIR | undefined, porDefecto: T | null): T | null {
  if (valor === undefined) return porDefecto;
  return valor === VALOR_OMITIR ? null : valor;
}

function resolveCapabilities(defaults: ProviderCapabilities, input: CapabilityInput): ProviderCapabilities {
  return {
    maxTokensParam: input.maxTokensParam ?? defaults.maxTokensParam,
    temperature: omittable(input.temperature, defaults.temperature),
    thinking: omittable(input.thinking, defaults.thinking),
    reasoningPassback: input.reasoningPassback ?? defaults.reasoningPassback,
    toolChoiceNone: input.toolChoiceNone ?? defaults.toolChoiceNone,
  };
}

function resolveKey(baseUrl: string, sources: KeySources): string | null {
  if (sources.explicit !== undefined) return sources.explicit;
  if (sources.inherited !== null && sources.inherited.baseUrl === baseUrl) return sources.inherited.apiKey;
  if (baseUrl === PRESET_DEEPSEEK.baseUrl) return sources.deepseekAlias ?? null;
  return null;
}

function primaryCapabilities(input: AgentEnvInput): CapabilityInput {
  return {
    maxTokensParam: input.LLM_MAX_TOKENS_PARAM,
    temperature: input.LLM_TEMPERATURE,
    thinking: input.LLM_THINKING,
    reasoningPassback: input.LLM_REASONING_PASSBACK,
    toolChoiceNone: input.LLM_TOOL_CHOICE_NONE,
  };
}

function fallbackCapabilities(input: AgentEnvInput): CapabilityInput {
  return {
    maxTokensParam: input.LLM_FALLBACK_MAX_TOKENS_PARAM,
    temperature: input.LLM_FALLBACK_TEMPERATURE,
    thinking: input.LLM_FALLBACK_THINKING,
    reasoningPassback: input.LLM_FALLBACK_REASONING_PASSBACK,
    toolChoiceNone: input.LLM_FALLBACK_TOOL_CHOICE_NONE,
  };
}

function resolvePrimary(input: AgentEnvInput, ctx: z.RefinementCtx): ProviderSettings | null {
  const preset = presetOf(input.LLM_PROVIDER);
  const baseUrl = input.LLM_BASE_URL ?? preset?.baseUrl;
  const model = input.LLM_MODEL ?? preset?.model;
  if (baseUrl === undefined) {
    ctx.addIssue({ code: "custom", message: TEXTO_ENV.urlRequerida, path: ["LLM_BASE_URL"] });
  }
  if (model === undefined) {
    ctx.addIssue({ code: "custom", message: TEXTO_ENV.modeloRequerido, path: ["LLM_MODEL"] });
  }
  if (baseUrl === undefined || model === undefined) return null;
  return {
    provider: input.LLM_PROVIDER,
    baseUrl,
    model,
    apiKey: resolveKey(baseUrl, {
      explicit: input.LLM_API_KEY,
      inherited: null,
      deepseekAlias: input.DEEPSEEK_API_KEY,
    }),
    maxOutputTokens: input.LLM_MAX_OUTPUT_TOKENS,
    capabilities: resolveCapabilities(preset ?? CAPACIDADES_GENERICAS, primaryCapabilities(input)),
  };
}

function resolveFallback(input: AgentEnvInput, primary: ProviderSettings): ProviderSettings | null {
  if (!input.LLM_FALLBACK_ENABLED) return null;
  const provider = input.LLM_FALLBACK_PROVIDER ?? primary.provider;
  const preset = presetOf(provider);
  const baseUrl = input.LLM_FALLBACK_BASE_URL ?? preset?.baseUrl ?? primary.baseUrl;
  const model = input.LLM_FALLBACK_MODEL ?? preset?.fallbackModel;
  if (model === undefined) return null;
  if (model === primary.model && baseUrl === primary.baseUrl) return null;
  return {
    provider,
    baseUrl,
    model,
    apiKey: resolveKey(baseUrl, {
      explicit: input.LLM_FALLBACK_API_KEY,
      inherited: primary,
      deepseekAlias: input.DEEPSEEK_API_KEY,
    }),
    maxOutputTokens: primary.maxOutputTokens,
    capabilities: resolveCapabilities(preset ?? CAPACIDADES_GENERICAS, fallbackCapabilities(input)),
  };
}

const resolvedAgentEnvSchema = agentEnvSchema.transform((input, ctx): AgentEnv => {
  const primary = resolvePrimary(input, ctx);
  if (primary === null) return z.NEVER;
  return {
    primary,
    fallback: resolveFallback(input, primary),
    timeoutMs: input.LLM_TIMEOUT_MS,
    maxRetries: input.LLM_MAX_RETRIES,
    turnDeadlineMs: input.AGENT_TURN_DEADLINE_MS,
    maxIterations: input.AGENT_MAX_ITERATIONS,
    sessionTokenBudget: input.AGENT_SESSION_TOKEN_BUDGET,
    sessionTtlMinutes: input.AGENT_SESSION_TTL_MINUTES,
    maxSessions: input.AGENT_MAX_SESSIONS,
    logLevel: input.LOG_LEVEL,
  };
});

export function parseAgentEnv(source: EnvSource) {
  return resolvedAgentEnvSchema.safeParse(source, { error: z.locales.es().localeError });
}

export function readAgentEnv() {
  return parseAgentEnv(process.env);
}

const accessCode = z.preprocess(
  emptyAsUndefined,
  z
    .string({ error: TEXTO_ENV.codigoAccesoRequerido })
    .trim()
    .min(LONGITUD_MINIMA_CODIGO_ACCESO, TEXTO_ENV.codigoAccesoCorto)
    .max(LONGITUD_MAXIMA_CODIGO_ACCESO),
);

const serverEnvSchema = z
  .object({
    PORT: withDefault(z.coerce.number().int().min(1).max(PUERTO_MAXIMO), PUERTO_API_POR_DEFECTO),
    NODE_ENV: withDefault(z.enum(ENTORNO_APP), ENTORNO_APP.PRODUCCION),
    ACCESS_CODE: accessCode,
    ACCESS_TOKEN_SECRET: optional(z.string().min(LONGITUD_MINIMA_SECRETO_TOKEN, TEXTO_ENV.secretoTokenCorto)),
    ACCESS_TOKEN_TTL_HOURS: withDefault(
      positiveInt(VIGENCIA_ACCESO_HORAS_TOPE),
      VIGENCIA_ACCESO_HORAS_POR_DEFECTO,
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === ENTORNO_APP.PRODUCCION && env.ACCESS_TOKEN_SECRET === undefined) {
      ctx.addIssue({
        code: "custom",
        message: TEXTO_ENV.secretoTokenRequerido,
        path: [VARIABLE_SECRETO_TOKEN],
      });
    }
    if (env.ACCESS_TOKEN_SECRET === env.ACCESS_CODE) {
      ctx.addIssue({
        code: "custom",
        message: TEXTO_ENV.secretoTokenRepetido,
        path: [VARIABLE_SECRETO_TOKEN],
      });
    }
  });

export type ServerEnv = z.output<typeof serverEnvSchema>;

export function parseServerEnv(source: EnvSource) {
  return serverEnvSchema.safeParse(source, { error: z.locales.es().localeError });
}

export function readServerEnv() {
  return parseServerEnv(process.env);
}
