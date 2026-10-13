import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const ROL_MENSAJE = {
  SISTEMA: "system",
  USUARIO: "user",
  ASISTENTE: "assistant",
  HERRAMIENTA: "tool",
} as const;

export const FIN_LLM = {
  TEXTO: "texto",
  HERRAMIENTAS: "herramientas",
  LIMITE: "limite",
} as const;

export const FINISH_REASON = {
  STOP: "stop",
  LENGTH: "length",
  TOOL_CALLS: "tool_calls",
  CONTENT_FILTER: "content_filter",
  INSUFFICIENT_SYSTEM_RESOURCE: "insufficient_system_resource",
  ERROR: "error",
} as const;

export const TIPO_ERROR_LLM = {
  PETICION_INVALIDA: "peticion_invalida",
  AUTENTICACION: "autenticacion",
  SALDO: "saldo",
  LIMITE_TASA: "limite_tasa",
  SERVIDOR: "servidor",
  RED: "red",
  TIMEOUT: "timeout",
  ABORTADO: "abortado",
  RESPUESTA_INVALIDA: "respuesta_invalida",
  FILTRO_CONTENIDO: "filtro_contenido",
} as const;

export const TIPOS_ERROR_LLM_REINTENTABLES: ReadonlySet<string> = new Set([
  TIPO_ERROR_LLM.LIMITE_TASA,
  TIPO_ERROR_LLM.SERVIDOR,
  TIPO_ERROR_LLM.RED,
  TIPO_ERROR_LLM.TIMEOUT,
  TIPO_ERROR_LLM.RESPUESTA_INVALIDA,
]);

export const TIPO_ERROR_POR_FIN: ReadonlyMap<string, ValorDe<typeof TIPO_ERROR_LLM>> = new Map([
  [FINISH_REASON.CONTENT_FILTER, TIPO_ERROR_LLM.FILTRO_CONTENIDO],
  [FINISH_REASON.INSUFFICIENT_SYSTEM_RESOURCE, TIPO_ERROR_LLM.SERVIDOR],
  [FINISH_REASON.ERROR, TIPO_ERROR_LLM.SERVIDOR],
]);

export const MS_POR_SEGUNDO = 1000;
export const CARACTERES_POR_TOKEN = 4;
export const BACKOFF_BASE_MS = 500;
export const BACKOFF_TOPE_MS = 8000;

export const MODO_THINKING = {
  HABILITADO: "enabled",
  DESHABILITADO: "disabled",
} as const;

export const PARAMETRO_MAX_TOKENS = {
  MAX_TOKENS: "max_tokens",
  MAX_COMPLETION_TOKENS: "max_completion_tokens",
} as const;

export const TOOL_CHOICE = {
  AUTO: "auto",
  NINGUNA: "none",
} as const;

export const TIPO_HERRAMIENTA_WIRE = "function";
export const ARGUMENTOS_VACIOS = "{}";

export const ESTADO_HTTP = {
  PETICION_INVALIDA: 400,
  NO_AUTORIZADO: 401,
  PAGO_REQUERIDO: 402,
  PROHIBIDO: 403,
  NO_PROCESABLE: 422,
  DEMASIADAS_PETICIONES: 429,
  ERROR_SERVIDOR: 500,
} as const;

export const PROVEEDOR_DEEPSEEK = "deepseek";

export const PRESET_DEEPSEEK = {
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-flash",
  fallbackModel: "deepseek-v4-pro",
  maxTokensParam: PARAMETRO_MAX_TOKENS.MAX_TOKENS,
  temperature: 0,
  thinking: MODO_THINKING.DESHABILITADO,
  reasoningPassback: true,
  toolChoiceNone: true,
} as const;

export const RUTA_CHAT_COMPLETIONS = "/chat/completions";
export const MAX_TOKENS_SALIDA_POR_DEFECTO = 2048;

export const CABECERA_HTTP = {
  AUTORIZACION: "Authorization",
  TIPO_CONTENIDO: "Content-Type",
  REINTENTAR_TRAS: "Retry-After",
} as const;

export const PREFIJO_BEARER = "Bearer ";
export const TIPO_CONTENIDO_JSON = "application/json";
export const METODO_POST = "POST";

export const VALOR_OMITIR = "omit";
export const HOSTS_LOOPBACK: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);
export const PROTOCOLO_SEGURO = "https:";
export const PROTOCOLO_LOOPBACK = "http:";
export const MAX_TOKENS_SALIDA_TOPE = 65_536;
export const TEMPERATURA_MAXIMA = 2;
export const TIMEOUT_LLM_MS_POR_DEFECTO = 45_000;
export const REINTENTOS_LLM_POR_DEFECTO = 2;
export const REINTENTOS_LLM_TOPE = 5;

export const BOOLEANO_ENV = {
  VERDADERO: "true",
  FALSO: "false",
} as const;

export const PRESETS_PROVEEDOR = {
  [PROVEEDOR_DEEPSEEK]: PRESET_DEEPSEEK,
} as const;

export const CAPACIDADES_GENERICAS = {
  maxTokensParam: PARAMETRO_MAX_TOKENS.MAX_TOKENS,
  temperature: 0,
  thinking: null,
  reasoningPassback: false,
  toolChoiceNone: true,
} as const;
