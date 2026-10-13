import { z } from "zod";
import { LIMITES_ARGS, LONGITUD_MAXIMA_CASO } from "@/config/constants/limits.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { PATRON_RUTA_MAESTRO } from "@/config/constants/patterns.constants.ts";
import { DESCRIPCION_ARG } from "@/config/strings.ts";

const caso = z.string().max(LONGITUD_MAXIMA_CASO).describe(DESCRIPCION_ARG.caso);

const etiqueta = z.string().min(1).max(LIMITES_ARGS.etiqueta);

const itemMapeo = z
  .object({
    etiqueta: etiqueta.describe(DESCRIPCION_ARG.etiquetaMapeo),
    estado: z.enum(ESTADO_CAMPO).describe(DESCRIPCION_ARG.estadoMapeo),
    ruta: z.string().regex(PATRON_RUTA_MAESTRO).nullable().describe(DESCRIPCION_ARG.rutaMapeo),
  })
  .strict();

export const argsLeerSolicitud = { caso };

export const argsMapearCampos = {
  caso,
  campos: z
    .array(etiqueta.describe(DESCRIPCION_ARG.etiquetaCampo))
    .max(LIMITES_ARGS.elementos)
    .describe(DESCRIPCION_ARG.campos),
};

export const argsGenerarFormulario = {
  caso,
  mapeo: z.array(itemMapeo).max(LIMITES_ARGS.elementos).describe(DESCRIPCION_ARG.mapeo),
};

export const argsArmarPaquete = { caso };

export const argsSimularEnvio = {
  caso,
  confirmado: z.boolean().default(false).describe(DESCRIPCION_ARG.confirmado),
};
