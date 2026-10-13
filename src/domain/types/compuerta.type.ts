import type { ACCION } from "@/config/constants/agent.constants.ts";
import type { ESTADO_COMPUERTA, EVENTO_COMPUERTA } from "@/config/constants/confirmation.constants.ts";
import type { MotivoBloqueo } from "@/domain/types/checklist.type.ts";

export type CasoPendiente = {
  readonly caso: string;
  readonly bloqueos: readonly string[];
  readonly motivos: readonly MotivoBloqueo[];
};

export type PaquetesConocidos = Readonly<Record<string, CasoPendiente>>;

export type EstadoCompuerta =
  | { readonly tipo: typeof ESTADO_COMPUERTA.LIBRE }
  | {
      readonly tipo: typeof ESTADO_COMPUERTA.PENDIENTE;
      readonly accion: typeof ACCION.ENVIO;
      readonly casos: readonly CasoPendiente[];
    };

export type AperturaTurno = {
  readonly autorizado: string | null;
  readonly siguiente: EstadoCompuerta;
  readonly preguntarCual: boolean;
};

export type AutorizacionTurno = { readonly caso: string | null; readonly usada: boolean };

export type EvaluacionEnvio = { readonly permitido: boolean; readonly siguiente: AutorizacionTurno };

export type EventoCompuerta =
  | { readonly tipo: typeof EVENTO_COMPUERTA.ARMADO; readonly pendiente: CasoPendiente }
  | { readonly tipo: typeof EVENTO_COMPUERTA.BLOQUEADO; readonly caso: string }
  | { readonly tipo: typeof EVENTO_COMPUERTA.ENVIADO; readonly caso: string };

export type EntradaCierreCompuerta = {
  readonly arrastrados: readonly CasoPendiente[];
  readonly eventos: readonly EventoCompuerta[];
  readonly conocidos: PaquetesConocidos;
  readonly abortado: boolean;
};
