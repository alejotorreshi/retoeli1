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
