import type { TIPO_HOJA_MAESTRO } from "@/config/constants/mapping.constants.ts";

export type ValorMaestro =
  | string
  | number
  | boolean
  | null
  | readonly ValorMaestro[]
  | { readonly [clave: string]: ValorMaestro };

export type Maestro = Readonly<Record<string, ValorMaestro>>;

export type HojaMaestro =
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.TEXTO; readonly valor: string }
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.NO_TEXTUAL }
  | { readonly tipo: typeof TIPO_HOJA_MAESTRO.AUSENTE };
