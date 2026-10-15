import type { LlmHealthState } from "@/llm/types/resilience.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { AccionEstructurada } from "@/loop/types/turno.type.ts";
import type { VistaSesion } from "@/loop/types/vista-sesion.type.ts";

export type HealthResponse = {
  readonly ok: true;
  readonly provider: string;
  readonly model: string;
  readonly llm: LlmHealthState;
};

export type ChatBody = {
  readonly sessionId: string | null;
  readonly message: string;
  readonly accion?: AccionEstructurada | undefined;
};

export type AccessBody = {
  readonly codigo: string;
};

export type ConfigResponse = {
  readonly fechaEjecucion: string;
  readonly zona: string;
  readonly casos: readonly string[];
  readonly presupuestoSesion: number;
  readonly mensajeMaximo: number;
};

export type ErrorResponse = {
  readonly mensaje: string;
};

export type VisibleToolCall = {
  readonly herramienta: string;
  readonly argumentos: unknown;
  readonly ok: boolean;
  readonly codigo: string | null;
  readonly resumen: string | null;
};

export type ChatJsonResponse = {
  readonly sessionId: string | null;
  readonly reply: string;
  readonly toolCalls: readonly VisibleToolCall[];
  readonly needsConfirmation: boolean;
};

export type SseEvent = EventoAgente;

export type SseFrame = {
  readonly event: string;
  readonly data: string;
};

export type SessionViewResponse = VistaSesion;
