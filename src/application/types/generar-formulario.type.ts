import type { ItemMapeo } from "@/domain/types/comparar-mapeo.type.ts";
import type { ConteoEstados } from "@/domain/types/mapeo.type.ts";
import type { Formato } from "@/domain/types/solicitud.type.ts";

export type ArgsGenerarFormulario = {
  readonly caso: string;
  readonly mapeo: readonly ItemMapeo[];
};

export type DatosFormulario = {
  readonly caso: string;
  readonly ruta: string;
  readonly formato: Formato;
  readonly conteo: ConteoEstados;
  readonly aviso: string | null;
};
