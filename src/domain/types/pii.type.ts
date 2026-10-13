import type { TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { EstadoCampo, ReglaMapeo } from "@/domain/types/reglas.type.ts";

export type TipoMascara = ValorDe<typeof TIPO_MASCARA>;

export type CampoPresentado = {
  readonly etiqueta: string;
  readonly ruta: string | null;
  readonly estado: EstadoCampo;
  readonly regla: ReglaMapeo;
  readonly confianza: number;
  readonly valor_enmascarado: string | null;
  readonly nota: string | null;
  readonly propuesta: string | null;
};
