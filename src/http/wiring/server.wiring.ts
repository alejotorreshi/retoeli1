import { Hono } from "hono";
import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import {
  BYTES_SECRETO_TOKEN,
  CODIFICACION_SECRETO_TOKEN,
  ENTORNO_APP,
  EVENTO_HTTP,
  HOST_SERVIDOR,
  LATIDO_SSE_MS,
  RESPUESTA_HTTP,
  RUTA_API_PROTEGIDA,
} from "@/config/constants/http.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { MS_POR_HORA } from "@/config/constants/runtime.constants.ts";
import {
  type AgentEnv,
  parseAgentEnv,
  parseServerEnv,
  readAgentEnv,
  readServerEnv,
  type ServerEnv,
} from "@/config/env.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { requireAccess } from "@/http/middlewares/access.middleware.ts";
import { registerAccessRoute } from "@/http/routes/access.route.ts";
import { registerChatRoute } from "@/http/routes/chat.route.ts";
import { registerHealthRoute } from "@/http/routes/health.route.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type {
  AccessSettings,
  HttpEnv,
  ServerCreation,
  ServerOptions,
  ServerStart,
} from "@/http/types/server.type.ts";
import { createLogger } from "@/infra/logging/logger.adapter.ts";
import type { OpcionesAgente } from "@/loop/types/agente.type.ts";
import { crearAgente, secretosDelAgente } from "@/loop/wiring/agente.wiring.ts";

function readEnv(options: ServerOptions) {
  return options.envSource === undefined ? readServerEnv() : parseServerEnv(options.envSource);
}

function readAgentConfig(options: ServerOptions) {
  return options.envSource === undefined ? readAgentEnv() : parseAgentEnv(options.envSource);
}

function agentOptions(options: ServerOptions): OpcionesAgente {
  return {
    directorio: options.rootDirectory,
    fetch: options.fetch,
    ...(options.envSource === undefined ? {} : { fuenteEntorno: options.envSource }),
    ...(options.wait === undefined ? {} : { esperar: options.wait }),
    ...(options.logDestination === undefined ? {} : { destinoLogs: options.logDestination }),
  };
}

function ephemeralTokenSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_SECRETO_TOKEN));
  return Buffer.from(bytes).toString(CODIFICACION_SECRETO_TOKEN);
}

function accessSettings(env: ServerEnv, options: ServerOptions): AccessSettings {
  return {
    code: env.ACCESS_CODE,
    tokenSecret: env.ACCESS_TOKEN_SECRET ?? ephemeralTokenSecret(),
    ttlMs: env.ACCESS_TOKEN_TTL_HOURS * MS_POR_HORA,
    secureCookie: env.NODE_ENV !== ENTORNO_APP.DESARROLLO,
    now: options.now ?? Date.now,
  };
}

function httpLogger(options: ServerOptions, config: AgentEnv, secrets: readonly string[]) {
  const destination = options.logDestination === undefined ? {} : { destination: options.logDestination };
  return createLogger({ level: config.logLevel, secrets, ...destination });
}

function registerFallbackHandlers(app: Hono<HttpEnv>, logger: BitacoraEstructurada): void {
  app.notFound((c) => {
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.rutaNoEncontrada };
    return c.json(body, RESPUESTA_HTTP.NO_ENCONTRADO);
  });
  app.onError((error, c) => {
    logger.error(EVENTO_HTTP.ERROR_NO_CONTROLADO, { error, path: c.req.path });
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.errorInterno };
    return c.json(body, RESPUESTA_HTTP.ERROR_INTERNO);
  });
}

export function createServer(options: ServerOptions): ServerCreation {
  const env = readEnv(options);
  if (!env.success) return { ok: false, mensaje: formatearIssues(env.error.issues, MAX_ISSUES_ARGS) };
  const creation = crearAgente(agentOptions(options));
  if (!creation.ok) return { ok: false, mensaje: creation.mensaje };
  const config = readAgentConfig(options);
  if (!config.success) return { ok: false, mensaje: formatearIssues(config.error.issues, MAX_ISSUES_ARGS) };
  const access = accessSettings(env.data, options);
  const secrets = [...secretosDelAgente(config.data), access.code, access.tokenSecret];
  const logger = httpLogger(options, config.data, secrets);
  const app = new Hono<HttpEnv>();
  registerFallbackHandlers(app, logger);
  registerHealthRoute(app, { provider: creation.agente.proveedor, model: creation.agente.modelo });
  registerAccessRoute(app, access);
  app.use(RUTA_API_PROTEGIDA, requireAccess(access));
  registerChatRoute(app, {
    agente: creation.agente,
    secrets,
    logger,
    heartbeatMs: options.heartbeatMs ?? LATIDO_SSE_MS,
  });
  return { ok: true, app, port: env.data.PORT };
}

export function startServer(rootDirectory: string): ServerStart {
  const creation = createServer({ rootDirectory, fetch });
  if (!creation.ok) return creation;
  const server = Bun.serve({ hostname: HOST_SERVIDOR, port: creation.port, fetch: creation.app.fetch });
  return { ok: true, url: server.url.href };
}
