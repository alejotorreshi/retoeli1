import type { Hono } from "hono";
import type { BitacoraEstructurada, DestinoBitacora } from "@/application/types/puertos-agente.type.ts";
import type { RESULTADO_BEARER } from "@/config/constants/http.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { ConfigResponse } from "@/http/types/api.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { RetryOptions } from "@/llm/types/resilience.type.ts";

export type HttpBindings = {
  timeout(request: Request, seconds: number): void;
  requestIP(request: Request): { readonly address: string } | null;
};

export type HttpVariables = { clientIp: string };

export type HttpEnv = { Bindings: HttpBindings; Variables: HttpVariables };

export type BearerCheck = ValorDe<typeof RESULTADO_BEARER>;

export type RateLimiterOptions = {
  readonly limit: number;
  readonly windowMs: number;
  readonly maxKeys: number;
  readonly now: () => number;
};

export type RateLimiter = {
  hit(key: string): boolean;
  isLocked(key: string): boolean;
  retryAfterMs(key: string): number;
};

export type ObservableRateLimiter = RateLimiter & {
  trackedKeys(): number;
};

export type ReleaseSlot = () => void;

export type TurnSlots = {
  tryAcquire(): ReleaseSlot | null;
};

export type ObservableTurnSlots = TurnSlots & {
  inUse(): number;
};

export type ClientIpInput = {
  readonly forwardedFor: string | undefined;
  readonly socketAddress: string | undefined;
  readonly trustedHops: number;
};

export type ClientIpSettings = {
  readonly trustedHops: number;
  readonly logger: BitacoraEstructurada;
};

export type ServerOptions = {
  readonly rootDirectory: string;
  readonly fetch: FetchLike;
  readonly envSource?: Readonly<Record<string, string | undefined>>;
  readonly wait?: RetryOptions["wait"];
  readonly logDestination?: DestinoBitacora;
  readonly heartbeatMs?: number;
  readonly now?: () => number;
  readonly webDirectory?: string;
};

export type StaticSettings = {
  readonly webDirectory: string;
};

export type AccessSettings = {
  readonly code: string;
  readonly tokenSecret: string;
  readonly signingKey: string;
  readonly ttlMs: number;
  readonly secureCookie: boolean;
  readonly now: () => number;
  readonly failedAttempts: RateLimiter;
  readonly lockedMessage: string;
};

export type ConfigSource = () => Promise<ConfigResponse>;

export type ServerCreation =
  | { readonly ok: true; readonly app: Hono<HttpEnv>; readonly port: number }
  | { readonly ok: false; readonly mensaje: string };

export type ServerStart =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly mensaje: string };
