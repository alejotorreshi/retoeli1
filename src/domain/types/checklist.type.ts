import type { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";

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
  readonly aviso_emisor: string | null;
};

export type CampoPorConfirmar = { readonly etiqueta: string; readonly nota: string };

export type Checklist = {
  readonly fecha_ejecucion: FechaISO;
  readonly listo_para_firma: boolean;
  readonly bloqueos: readonly string[];
  readonly soportes: readonly SoporteEvaluado[];
  readonly faltantes: readonly string[];
  readonly requiere_confirmacion: readonly CampoPorConfirmar[];
};

export type FilaSoporteChecklist = {
  readonly tipo: string;
  readonly archivo: string;
  readonly vigencia: string;
  readonly estado: EstadoSoporte;
  readonly aviso: string;
  readonly pais_emisor: string;
};

export type DatosChecklist = {
  readonly caso: string;
  readonly cliente: string;
  readonly fecha_ejecucion: string;
  readonly estado: string;
  readonly motivos: readonly { readonly motivo: string }[];
  readonly soportes: readonly FilaSoporteChecklist[];
  readonly faltantes: readonly { readonly etiqueta: string }[];
  readonly por_confirmar: readonly CampoPorConfirmar[];
  readonly ausentes: readonly { readonly tipo: string }[];
  readonly vencidos: readonly { readonly tipo: string; readonly vigencia: string }[];
};

export type CasoChecklist = { readonly caso: string; readonly cliente: string };
