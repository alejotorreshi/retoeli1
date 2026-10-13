import { type Logger, type LoggerOptions as PinoOptions, pino } from "pino";
import type { BitacoraEstructurada, CamposBitacora } from "@/application/types/puertos-agente.type.ts";
import { RUTAS_REDACCION_LOG } from "@/config/constants/logging.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import type { LoggerOptions } from "@/infra/types/logger.type.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanFields(
  fields: CamposBitacora | undefined,
  secrets: readonly string[],
): Record<string, unknown> {
  const clean = redactar(fields ?? {}, secrets);
  return isRecord(clean) ? clean : {};
}

function wrap(logger: Logger, secrets: readonly string[]): BitacoraEstructurada {
  return {
    info: (event, fields) => logger.info(cleanFields(fields, secrets), event),
    advertir: (event, fields) => logger.warn(cleanFields(fields, secrets), event),
    error: (event, fields) => logger.error(cleanFields(fields, secrets), event),
    hijo: (fields) => wrap(logger.child(cleanFields(fields, secrets)), secrets),
  };
}

export function createLogger(options: LoggerOptions): BitacoraEstructurada {
  const pinoOptions: PinoOptions = {
    level: options.level,
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    redact: { paths: [...RUTAS_REDACCION_LOG], censor: TEXTO_MASCARA.oculto },
  };
  const logger =
    options.destination === undefined ? pino(pinoOptions) : pino(pinoOptions, options.destination);
  return wrap(logger, options.secrets);
}
