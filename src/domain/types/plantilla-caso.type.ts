import type { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type CampoCelda = {
  readonly hoja: string;
  readonly celda_etiqueta: string;
  readonly etiqueta: string;
  readonly celda_valor: string;
};

export type CampoLista = {
  readonly etiqueta: string;
  readonly obligatorio: boolean;
};

export type TipoPlantilla = ValorDe<typeof TIPO_PLANTILLA>;

export type PlantillaCaso =
  | {
      readonly tipo: typeof TIPO_PLANTILLA.CELDAS;
      readonly archivo: string;
      readonly campos: readonly CampoCelda[];
    }
  | {
      readonly tipo: typeof TIPO_PLANTILLA.CAMPOS;
      readonly archivo: string;
      readonly campos: readonly CampoLista[];
    };
