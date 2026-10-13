import type { IndiceGlosario } from "@/domain/types/glosario.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { EstadoCampo, ReglaMapeo, Reglas } from "@/domain/types/reglas.type.ts";

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
