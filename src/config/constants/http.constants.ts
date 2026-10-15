export const PUERTO_API_POR_DEFECTO = 3000;

export const PUERTO_MAXIMO = 65_535;

export const PUERTO_WEB_DEV = 5173;

export const DIRECTORIO_WEB_DIST = "web/dist";

export const ARCHIVO_INDEX_WEB = "index.html";

export const HOST_SERVIDOR = "0.0.0.0";

export const PREFIJO_API = "/api";

export const RUTA_API = {
  SALUD: `${PREFIJO_API}/health`,
  CHAT: `${PREFIJO_API}/chat`,
  ACCESO: `${PREFIJO_API}/acceso`,
  CONFIG: `${PREFIJO_API}/config`,
} as const;

export const RUTA_API_PROTEGIDA = `${PREFIJO_API}/*`;

export const RUTA_COMODIN = "*";

export const ENTORNO_APP = {
  PRODUCCION: "production",
  DESARROLLO: "development",
  PRUEBA: "test",
} as const;

export const NOMBRE_COOKIE_ACCESO = "acceso";

export const VERSION_TOKEN_ACCESO = "v1";

export const SEPARADOR_TOKEN = ".";

export const PARTES_TOKEN_ACCESO = 2;

export const VARIABLE_SECRETO_TOKEN = "ACCESS_TOKEN_SECRET";

export const RUTA_COOKIE = PREFIJO_API;

export const SAME_SITE_COOKIE = "Strict";

export const PREFIJO_BEARER = "Bearer ";

export const RESULTADO_BEARER = {
  AUSENTE: "absent",
  VALIDO: "valid",
  INVALIDO: "invalid",
  BLOQUEADO: "locked",
} as const;

export const LONGITUD_MINIMA_CODIGO_ACCESO = 12;

export const LONGITUD_MAXIMA_CODIGO_ACCESO = 256;

export const LONGITUD_MINIMA_SECRETO_TOKEN = 32;

export const BYTES_SECRETO_TOKEN = 32;

export const CODIFICACION_SECRETO_TOKEN = "hex";

export const VIGENCIA_ACCESO_HORAS_POR_DEFECTO = 12;

export const VIGENCIA_ACCESO_HORAS_TOPE = 168;

export const SALTOS_PROXY_POR_DEFECTO = 1;

export const SALTOS_PROXY_TOPE = 10;

export const SEPARADOR_X_FORWARDED_FOR = ",";

export const IP_DESCONOCIDA = "unknown";

export const INTENTOS_FALLIDOS_ACCESO_POR_DEFECTO = 5;

export const VENTANA_FALLOS_ACCESO_MINUTOS_POR_DEFECTO = 15;

export const LATIDO_SSE_MS = 8_000;

export const COMENTARIO_LATIDO = "ping";

export const CABECERA = {
  CACHE_CONTROL: "Cache-Control",
  X_ACCEL_BUFFERING: "X-Accel-Buffering",
  ACCEPT: "Accept",
  AUTORIZACION: "Authorization",
  X_FORWARDED_FOR: "X-Forwarded-For",
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
  IP_CLIENTE_RESUELTA: "http_client_ip_resolved",
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
