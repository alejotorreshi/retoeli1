import type { EntradaFormularioPdf } from "@/application/types/puertos.type.ts";
import type { COLOR_TRAZO } from "@/config/constants/pdf.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";

export type ColorTrazo = ValorDe<typeof COLOR_TRAZO>;

export type LineaPdf = {
  readonly x: number;
  readonly y: number;
  readonly texto: string;
  readonly tamano: number;
  readonly negrita: boolean;
  readonly color: ColorTrazo;
};

export type Pagina = { readonly lineas: readonly LineaPdf[] };

export type Medir = (texto: string, tamano: number, negrita: boolean) => number;

export type EntradaLayoutPdf = EntradaFormularioPdf & { readonly fecha: FechaISO };
