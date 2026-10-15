import type { ACCION, CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

export type MotivoFin = ValorDe<typeof MOTIVO_FIN>;

export type CodigoAgente = ValorDe<typeof CODIGO_AGENTE>;

export type EventoInicioTurno = {
  readonly tipo: typeof TIPO_EVENTO.INICIO_TURNO;
  readonly sesionId: string;
  readonly turnoId: string;
  readonly sesionNueva: boolean;
  readonly sesionExpirada: boolean;
};

export type EventoInicioHerramienta = {
  readonly tipo: typeof TIPO_EVENTO.INICIO_HERRAMIENTA;
  readonly turnoId: string;
  readonly llamadaId: string;
  readonly herramienta: string;
  readonly caso: string | null;
  readonly argumentos: unknown;
};

export type EventoFinHerramienta = {
  readonly tipo: typeof TIPO_EVENTO.FIN_HERRAMIENTA;
  readonly turnoId: string;
  readonly llamadaId: string;
  readonly herramienta: string;
  readonly caso: string | null;
  readonly ok: boolean;
  readonly codigo: string | null;
  readonly resumen: string | null;
  readonly resultado: ResultadoVisible | null;
};

export type EventoTexto = {
  readonly tipo: typeof TIPO_EVENTO.TEXTO;
  readonly turnoId: string;
  readonly texto: string;
};

export type EventoConfirmacionRequerida = {
  readonly tipo: typeof TIPO_EVENTO.CONFIRMACION_REQUERIDA;
  readonly turnoId: string;
  readonly caso: string;
  readonly accion: typeof ACCION.ENVIO;
  readonly bloqueos: readonly string[];
};

export type EventoUso = {
  readonly tipo: typeof TIPO_EVENTO.USO;
  readonly turnoId: string;
  readonly entrada: number;
  readonly salida: number;
  readonly cacheHit: number;
  readonly totalSesion: number;
  readonly proveedor: string;
  readonly modelo: string;
};

export type EventoError = {
  readonly tipo: typeof TIPO_EVENTO.ERROR;
  readonly turnoId: string;
  readonly codigo: CodigoAgente;
  readonly mensaje: string;
};

export type EventoFinTurno = {
  readonly tipo: typeof TIPO_EVENTO.FIN_TURNO;
  readonly turnoId: string;
  readonly motivo: MotivoFin;
  readonly needsConfirmation: boolean;
};

export type EventoAgente =
  | EventoInicioTurno
  | EventoInicioHerramienta
  | EventoFinHerramienta
  | EventoTexto
  | EventoConfirmacionRequerida
  | EventoUso
  | EventoError
  | EventoFinTurno;
