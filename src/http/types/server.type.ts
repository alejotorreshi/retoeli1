import type { Hono } from "hono";
import type { DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { RetryOptions } from "@/llm/types/resilience.type.ts";

export type HttpBindings = {
  timeout(request: Request, seconds: number): void;
  requestIP(request: Request): { readonly address: string } | null;
};

export type HttpEnv = { Bindings: HttpBindings };

export type ServerOptions = {
  readonly rootDirectory: string;
  readonly fetch: FetchLike;
  readonly envSource?: Readonly<Record<string, string | undefined>>;
  readonly wait?: RetryOptions["wait"];
  readonly logDestination?: DestinoBitacora;
  readonly heartbeatMs?: number;
};

export type ServerCreation =
  | { readonly ok: true; readonly app: Hono<HttpEnv>; readonly port: number }
  | { readonly ok: false; readonly mensaje: string };

export type ServerStart =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly mensaje: string };
