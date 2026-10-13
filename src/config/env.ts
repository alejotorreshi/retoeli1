import { z } from "zod";
import { PATRON_FECHA } from "@/config/constants/patterns.constants.ts";
import { LOCALE_INTL, ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import { TEXTO_ENV } from "@/config/strings.ts";
import { esFechaReal } from "@/domain/fecha.ts";

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

type EnvSource = Readonly<Record<string, string | undefined>>;

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
