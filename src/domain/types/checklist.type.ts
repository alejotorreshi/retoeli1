import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { EstadoSoporte, SoporteEvaluado } from "@/domain/types/soportes.type.ts";

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
  readonly nombre: string;
  readonly archivo: string;
  readonly vigencia: string;
  readonly estado: EstadoSoporte;
  readonly aviso: string;
  readonly pais_emisor: string;
  readonly aviso_emisor: string;
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
  readonly ausentes: readonly { readonly nombre: string }[];
  readonly vencidos: readonly { readonly nombre: string; readonly vigencia: string }[];
};

export type CasoChecklist = { readonly caso: string; readonly cliente: string };
