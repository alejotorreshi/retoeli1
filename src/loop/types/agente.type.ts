import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { RetryOptions } from "@/llm/types/resilience.type.ts";
import type { CodigoAgente, EventoAgente } from "@/loop/types/evento.type.ts";
import type { EntradaTurno } from "@/loop/types/turno.type.ts";

export type OpcionesAgente = {
  readonly directorio: string;
  readonly fetch: FetchLike;
  readonly fuenteEntorno?: Readonly<Record<string, string | undefined>>;
  readonly directorioAgente?: string;
  readonly directorioConocimiento?: string;
  readonly esperar?: RetryOptions["wait"];
  readonly destinoLogs?: DestinoBitacora;
  readonly secretosAdicionales?: readonly string[];
};

export type Agente = {
  readonly proveedor: string;
  readonly modelo: string;
  estadoLlm(): ValorDe<typeof ESTADO_LLM>;
  existeSesion(id: string): boolean;
  turno(entrada: EntradaTurno): AsyncGenerator<EventoAgente, void, undefined>;
};

export type CreacionAgente =
  | { readonly ok: true; readonly agente: Agente }
  | { readonly ok: false; readonly codigo: CodigoAgente; readonly mensaje: string };
