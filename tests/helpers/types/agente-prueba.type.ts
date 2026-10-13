import type { LlmFalso, PasoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { DependenciasTurno, EntradaTurno, Sesion } from "@/loop/types/turno.type.ts";

export type OpcionesAgentePrueba = {
  readonly raiz: string;
  readonly guion: readonly PasoLlmFalso[];
} & Partial<DependenciasTurno>;

export type ExtraTurno = Omit<EntradaTurno, "sesionId" | "mensaje">;

export type AgentePrueba = {
  readonly llm: LlmFalso;
  turno(mensaje: string, extra?: ExtraTurno): Promise<EventoAgente[]>;
  iniciar(mensaje: string, extra?: ExtraTurno): AsyncGenerator<EventoAgente, void, undefined>;
  sesionActual(): Sesion;
};
