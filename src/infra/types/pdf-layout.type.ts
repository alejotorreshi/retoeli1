import type { EntradaFormularioPdf } from "@/application/types/puertos.type.ts";
import type { COLOR_TRAZO } from "@/config/constants/pdf.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";

export type StrokeColor = ValorDe<typeof COLOR_TRAZO>;

export type PdfLine = {
  readonly x: number;
  readonly y: number;
  readonly texto: string;
  readonly tamano: number;
  readonly negrita: boolean;
  readonly color: StrokeColor;
};

export type PdfPage = { readonly lineas: readonly PdfLine[] };

export type MeasureText = (texto: string, tamano: number, negrita: boolean) => number;

export type PdfLayoutInput = EntradaFormularioPdf & { readonly fecha: FechaISO };
