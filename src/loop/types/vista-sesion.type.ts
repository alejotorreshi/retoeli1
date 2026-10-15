import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

export type HerramientaVista = {
  readonly llamadaId: string;
  readonly herramienta: string;
  readonly caso: string | null;
  readonly argumentos: unknown;
  readonly ok: boolean;
  readonly codigo: string | null;
  readonly resumen: string | null;
  readonly resultado: ResultadoVisible | null;
};

export type TurnoVista = {
  readonly mensaje: string;
  readonly herramientas: readonly HerramientaVista[];
  readonly texto: string | null;
};

export type PendienteVista = {
  readonly caso: string;
  readonly bloqueos: readonly string[];
  readonly bloqueosLegibles: readonly string[];
};

export type VistaSesion = {
  readonly sesionId: string;
  readonly turnos: readonly TurnoVista[];
  readonly pendientes: readonly PendienteVista[];
  readonly casosEnviados: readonly string[];
  readonly tokensUsados: number;
  readonly ocupada: boolean;
};
