import type { ConteoEstados } from "@/domain/types/mapeo.type.ts";
import type { CampoPresentado } from "@/domain/types/pii.type.ts";

export type ArgsMapearCampos = { readonly caso: string; readonly campos: readonly string[] };

export type DatosMapeo = {
  readonly caso: string;
  readonly pais: string;
  readonly conteo: ConteoEstados;
  readonly llenos: readonly CampoPresentado[];
  readonly faltantes: readonly CampoPresentado[];
  readonly requiere_confirmacion: readonly CampoPresentado[];
  readonly mapeo: string;
};
