import { z } from "zod";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { MapeoGuardado, SavedField } from "@/infra/types/artifact-reader.type.ts";

export const savedFieldSchema = z.object({
  etiqueta: z.string(),
  estado: z.enum(ESTADO_CAMPO),
  valor_enmascarado: z.string().nullable(),
  nota: z.string().nullable(),
}) satisfies z.ZodType<SavedField>;

export const mapeoGuardadoSchema = z.object({
  campos: z.array(savedFieldSchema),
}) satisfies z.ZodType<MapeoGuardado>;
