import type { TIPO_CELDA } from "@tests/helpers/tipo-celda.helper.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type TipoCelda = ValorDe<typeof TIPO_CELDA>;

export type CeldaLeida = {
  readonly hoja: string;
  readonly celda: string;
  readonly valor: unknown;
  readonly tipo: TipoCelda;
  readonly formato: string | null;
  readonly relleno: string | null;
  readonly nota: string | null;
  readonly negrita: boolean;
  readonly ajustada: boolean;
};

export type AnchoLeido = {
  readonly hoja: string;
  readonly columna: string;
  readonly ancho: number | null;
};

export type MetadatosXlsx = {
  readonly hojas: readonly string[];
  readonly creador: string;
  readonly modificadoPor: string;
  readonly creado: string;
  readonly modificado: string;
};
