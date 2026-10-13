import type { TIPO_HOJA_MAESTRO } from "@/config/constants/mapping.constants.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { EstadoCampo, ReglaMapeo, Reglas } from "@/domain/types/reglas.type.ts";

export type Glosario = Readonly<Record<string, string>>;

export type IndiceGlosario = {
  readonly exacto: ReadonlyMap<string, string>;
  readonly normalizado: ReadonlyMap<string, string>;
};

export type EntradaMapeo = {
  readonly etiquetas: readonly string[];
  readonly pais: string;
  readonly indice: IndiceGlosario;
  readonly maestro: Maestro;
  readonly reglas: Reglas;
};

export type CampoMapeado = {
  readonly etiqueta: string;
  readonly ruta: string | null;
  readonly estado: EstadoCampo;
  readonly regla: ReglaMapeo;
  readonly confianza: number;
  readonly valor: string | null;
  readonly nota: string | null;
  readonly propuesta: string | null;
};

export type ConteoEstados = Readonly<Record<EstadoCampo, number>>;

export type HojaMaestro =
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.TEXTO; readonly valor: string }
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.NO_TEXTUAL }
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.AUSENTE };
