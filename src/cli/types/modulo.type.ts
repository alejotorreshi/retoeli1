import type { MOTIVO_FUENTE_MODULO } from "@/config/constants/modulo.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type ArchivoModulo = {
  readonly ruta: string;
  readonly contenido: Uint8Array;
};

export type MotivoFuenteModulo = ValorDe<typeof MOTIVO_FUENTE_MODULO>;

export type LecturaModulo =
  | { readonly ok: true; readonly archivos: readonly ArchivoModulo[] }
  | { readonly ok: false; readonly ruta: string; readonly motivo: MotivoFuenteModulo };

export type OpcionesGeneracion = {
  readonly raiz: string;
  escribir(linea: string): void;
};

export type ResultadoGeneracion = { readonly fallido: boolean };
