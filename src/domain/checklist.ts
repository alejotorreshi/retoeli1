import type { CampoMapeado } from "./mapeo.ts";
import type { ReglasSoportes } from "./reglas.ts";
import { exito, type Resultado } from "./resultado.ts";
import type { FechaISO } from "./tipos.ts";

export type SoporteIndice = {
  readonly tipo: string;
  readonly archivo: string;
  readonly vigencia_hasta: string | null;
  readonly pais_emisor: string;
  readonly descripcion: string;
};

export type EstadoSoporte = "presente" | "ausente" | "vencido";

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

export function evaluarSoportes(
  _exigidos: readonly string[],
  _indice: readonly SoporteIndice[],
  _presentes: ReadonlySet<string>,
  _hoy: FechaISO,
  _paisCliente: string,
  _reglas: ReglasSoportes,
): Resultado<readonly SoporteEvaluado[]> {
  return exito([]);
}

export function construirChecklist(
  _soportes: readonly SoporteEvaluado[],
  _campos: readonly CampoMapeado[],
  hoy: FechaISO,
): Checklist {
  return {
    fecha_ejecucion: hoy,
    listo_para_firma: true,
    bloqueos: [],
    soportes: [],
    faltantes: [],
    requiere_confirmacion: [],
  };
}
