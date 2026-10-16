import type { ConfigResponse, SseEvent } from "@/http/types/api.type.ts";
import type { LlmHealthState } from "@/llm/types/resilience.type.ts";

export type RespuestasNativas = {
  readonly Response: typeof Response;
  readonly Headers: typeof Headers;
};

export type PedidoWeb = {
  readonly metodo: string;
  readonly ruta: string;
  readonly cuerpo: unknown;
};

export type RespuestaFalsa = {
  readonly estado: number;
  readonly cuerpo: unknown;
};

export type GuionChat = {
  readonly eventos: readonly SseEvent[];
  readonly retenidos?: readonly SseEvent[];
};

export type OpcionesRedWeb = {
  readonly nativos: RespuestasNativas;
  readonly config?: ConfigResponse;
  readonly configDisponible?: boolean;
  readonly salud?: LlmHealthState;
  readonly codigoAcceso?: string;
  readonly cookieDescartada?: boolean;
  readonly guiones?: readonly GuionChat[];
  readonly rutas?: Readonly<Record<string, RespuestaFalsa>>;
};

export type RedWeb = {
  readonly fetch: typeof fetch;
  readonly pedidos: readonly PedidoWeb[];
  readonly pedidosA: (ruta: string, metodo?: string) => PedidoWeb[];
  readonly encolarGuion: (guion: GuionChat) => void;
  readonly fijarSalud: (estado: LlmHealthState) => void;
  readonly fijarRuta: (ruta: string, respuesta: RespuestaFalsa) => void;
  readonly fijarConfigDisponible: (disponible: boolean) => void;
  readonly soltar: () => void;
};
