import type { Entorno, Registrar } from "@/application/types/puertos.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

export type OpcionesEntorno = { readonly directorioConocimiento?: string };

export type ContextoNormalizado = { readonly directorio: string; readonly sesion: string };

export type EntornoEjecucion = {
  readonly registrar: Registrar;
  readonly entorno: Resultado<Entorno>;
};
