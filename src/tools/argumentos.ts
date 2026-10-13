import { z } from "zod";
import { LIMITES_ARGS, LONGITUD_MAXIMA_CASO, PATRON_RUTA_MAESTRO } from "@/config/constantes.ts";
import { ESTADOS_CAMPO } from "@/domain/reglas.ts";

const caso = z
  .string()
  .max(LONGITUD_MAXIMA_CASO)
  .describe(
    "Identificador del caso en minúsculas, dígitos y guiones, por ejemplo co-industrias-delta. Si no existe, la respuesta trae los casos disponibles.",
  );

const etiqueta = z.string().min(1).max(LIMITES_ARGS.etiqueta);

const itemMapeo = z
  .object({
    etiqueta: etiqueta.describe("Etiqueta exacta de la plantilla, tal como la devolvió mapear_campos."),
    estado: z.enum(ESTADOS_CAMPO).describe("Estado del campo tal como lo devolvió mapear_campos."),
    ruta: z
      .string()
      .regex(PATRON_RUTA_MAESTRO)
      .nullable()
      .describe(
        "Ruta del dato en el maestro tal como la devolvió mapear_campos, o null si el campo es faltante.",
      ),
  })
  .strict();

export const argsLeerSolicitud = { caso };

export const argsMapearCampos = {
  caso,
  campos: z
    .array(etiqueta.describe("Etiqueta de la plantilla del caso."))
    .max(LIMITES_ARGS.elementos)
    .describe("Etiquetas de la plantilla que se quieren mapear; una lista vacía mapea todas las etiquetas."),
};

export const argsGenerarFormulario = {
  caso,
  mapeo: z
    .array(itemMapeo)
    .max(LIMITES_ARGS.elementos)
    .describe(
      "Mapeo completo devuelto por mapear_campos, solo con etiqueta, estado y ruta; nunca incluye valores.",
    ),
};

export const argsArmarPaquete = { caso };

export const argsSimularEnvio = {
  caso,
  confirmado: z
    .boolean()
    .default(false)
    .describe("true solo si la analista confirmó de forma explícita el envío en esta conversación."),
};
