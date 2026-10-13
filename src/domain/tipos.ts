import type { FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
export type Formato = ValorDe<typeof FORMATO>;

export type FechaISO = `${number}-${number}-${number}`;

export type Solicitud = {
  readonly id: string;
  readonly de: string;
  readonly para: string;
  readonly asunto: string;
  readonly fecha: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly cuerpo: string;
  readonly adjuntos: readonly string[];
};

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

export type Plantilla =
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

export type CampoSolicitado = {
  readonly etiqueta: string;
  readonly obligatorio: boolean | null;
};
