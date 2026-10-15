import type { EventoAgente } from "@/loop/types/evento.type.ts";

export type HealthResponse = {
  readonly ok: true;
  readonly provider: string;
  readonly model: string;
};

export type ChatBody = {
  readonly sessionId: string | null;
  readonly message: string;
};

export type AccessBody = {
  readonly codigo: string;
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
