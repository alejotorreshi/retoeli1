import type { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { ReglasSoportes } from "@/domain/types/reglas.type.ts";

export type SoporteIndice = {
  readonly tipo: string;
  readonly archivo: string;
  readonly vigencia_hasta: string | null;
  readonly pais_emisor: string;
  readonly descripcion: string;
};

export type EstadoSoporte = ValorDe<typeof ESTADO_SOPORTE>;

export type SoporteEvaluado = {
  readonly tipo: string;
  readonly estado: EstadoSoporte;
  readonly vigencia_hasta: string | null;
  readonly archivo: string | null;
  readonly aviso: string | null;
  readonly pais_emisor: string | null;
  readonly aviso_emisor: string | null;
};

export type EntradaEvaluacionSoportes = {
  readonly exigidos: readonly string[];
  readonly indice: readonly SoporteIndice[];
  readonly presentes: ReadonlySet<string>;
  readonly hoy: FechaISO;
  readonly paisCliente: string;
  readonly reglas: ReglasSoportes;
};
