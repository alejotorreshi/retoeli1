import { CLAVES_SENSIBLES } from "@/config/constants/redaction.constants.ts";

export const NIVELES_LOG = {
  FATAL: "fatal",
  ERROR: "error",
  ADVERTENCIA: "warn",
  INFO: "info",
  DEPURACION: "debug",
  TRAZA: "trace",
  SILENCIO: "silent",
} as const;

export const NIVEL_LOG_POR_DEFECTO = NIVELES_LOG.INFO;

export const RUTAS_REDACCION_LOG: readonly string[] = [...CLAVES_SENSIBLES].flatMap((clave) => [
  clave,
  `*.${clave}`,
  `headers.${clave}`,
  `*.headers.${clave}`,
]);
