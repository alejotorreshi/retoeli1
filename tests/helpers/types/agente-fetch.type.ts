import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

export type OpcionesAgenteFetch = {
  readonly raiz: string;
  readonly fetch: FetchLike;
  readonly entorno?: Readonly<Record<string, string>>;
  readonly destinoLogs?: DestinoBitacora;
};

export type AgenteFetch = {
  readonly agente: Agente;
  readonly esperas: number[];
  turno(mensaje: string): Promise<EventoAgente[]>;
};
