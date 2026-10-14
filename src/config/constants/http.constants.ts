export const PUERTO_API_POR_DEFECTO = 3000;

export const PUERTO_MAXIMO = 65_535;

export const PUERTO_WEB_DEV = 5173;

export const DIRECTORIO_WEB_DIST = "web/dist";

export const HOST_SERVIDOR = "0.0.0.0";

export const PREFIJO_API = "/api";

export const RUTA_API = {
  SALUD: `${PREFIJO_API}/health`,
  CHAT: `${PREFIJO_API}/chat`,
} as const;

export const LATIDO_SSE_MS = 8_000;

export const COMENTARIO_LATIDO = "ping";

export const CABECERA = {
  CACHE_CONTROL: "Cache-Control",
  X_ACCEL_BUFFERING: "X-Accel-Buffering",
  ACCEPT: "Accept",
} as const;

export const VALOR_CABECERA = {
  SIN_CACHE_NI_TRANSFORMACION: "no-cache, no-transform",
  SIN_BUFFER: "no",
} as const;

export const TIPO_CONTENIDO = {
  JSON: "application/json",
  SSE: "text/event-stream",
} as const;

export const EVENTO_HTTP = {
  STREAM_FALLIDO: "http_stream_failed",
  ERROR_NO_CONTROLADO: "http_unhandled_error",
} as const;

export const RESPUESTA_HTTP = {
  OK: 200,
  SIN_CONTENIDO: 204,
  PEDIDO_INVALIDO: 400,
  NO_AUTORIZADO: 401,
  NO_ENCONTRADO: 404,
  CUERPO_DEMASIADO_GRANDE: 413,
  TIPO_NO_SOPORTADO: 415,
  DEMASIADOS_PEDIDOS: 429,
  ERROR_INTERNO: 500,
  NO_DISPONIBLE: 503,
} as const;
