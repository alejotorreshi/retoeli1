import type { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import type { EstadoCampo } from "@/domain/types/reglas.type.ts";

export type FilaFormulario = {
  readonly etiqueta: string;
  readonly obligatorio: boolean | null;
  readonly estado: EstadoCampo;
  readonly valor: string | null;
  readonly nota: string | null;
};

export type FilaCelda = FilaFormulario & {
  readonly hoja: string;
  readonly celda_etiqueta: string;
  readonly celda_valor: string;
};

export type Formulario =
  | { readonly tipo: typeof TIPO_PLANTILLA.CELDAS; readonly filas: readonly FilaCelda[] }
  | { readonly tipo: typeof TIPO_PLANTILLA.CAMPOS; readonly filas: readonly FilaFormulario[] };
