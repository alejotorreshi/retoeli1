import type { ESTADO_EVIDENCIA_COSTO } from "@/config/constants/costo.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type Tarifa = {
  readonly cacheHit: number;
  readonly cacheMiss: number;
  readonly salida: number;
};

export type UsoAgregado = {
  readonly entrada: number;
  readonly cacheHit: number;
  readonly salida: number;
};

export type EstadoEvidenciaCosto = ValorDe<typeof ESTADO_EVIDENCIA_COSTO>;

export type PreciosEvidencia = {
  readonly fuente: string;
  readonly consultado: string;
  readonly moneda: string;
  readonly tokensPorUnidad: number;
  readonly pico: Tarifa;
  readonly valle: Tarifa;
};

export type CostoAcumulado = {
  readonly turnos: number;
  readonly llamadas: number;
  readonly entrada: number;
  readonly cacheHit: number;
  readonly cacheMiss: number;
  readonly salida: number;
  readonly costoPicoUsd: number;
  readonly costoValleUsd: number;
};

export type EscenarioCosto = CostoAcumulado & { readonly id: string };

export type EvidenciaCosto = {
  readonly estado: EstadoEvidenciaCosto;
  readonly fechaCorridaUtc: string | null;
  readonly proveedor: string | null;
  readonly modelo: string | null;
  readonly precios: PreciosEvidencia;
  readonly escenarios: readonly EscenarioCosto[];
  readonly total: CostoAcumulado | null;
};
