import type { Hono } from "hono";
import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";

export type OpcionesServidorPrueba = {
  readonly raiz: string;
  readonly fetch: FetchLike;
  readonly entorno?: Readonly<Record<string, string>>;
  readonly latidoMs?: number;
  readonly destinoLogs?: DestinoBitacora;
  readonly directorioWeb?: string;
};

export type FrameSse = {
  readonly event: string;
  readonly data: string;
};

export type LecturaSse = {
  readonly eventos: FrameSse[];
  readonly comentarios: string[];
  readonly secuencia: string[];
};

export type ServidorPrueba = {
  readonly app: Hono<HttpEnv>;
  readonly port: number;
  pedir(ruta: string, init?: RequestInit): Promise<Response>;
  leerSse(respuesta: Response): Promise<LecturaSse>;
};
