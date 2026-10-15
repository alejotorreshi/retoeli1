import { resolve } from "node:path";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import {
  BYTES_SECRETO_TOKEN,
  CODIFICACION_SECRETO_TOKEN,
  DIRECTORIO_WEB_DIST,
  ENTORNO_APP,
  EVENTO_HTTP,
  FUENTE_CSP,
  HOST_SERVIDOR,
  LATIDO_SSE_MS,
  RESPUESTA_HTTP,
  RUTA_API,
  RUTA_API_PROTEGIDA,
  RUTA_COMODIN,
  VARIABLE_SECRETO_TOKEN,
  VENTANA_MENSAJES_CHAT_MINUTOS,
  VENTANA_SESIONES_NUEVAS_HORAS,
} from "@/config/constants/http.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import {
  MS_POR_HORA,
  MS_POR_MINUTO,
  ZONA_HORARIA_POR_DEFECTO,
} from "@/config/constants/runtime.constants.ts";
import {
  type AgentEnv,
  parseAgentEnv,
  parseServerEnv,
  readAgentEnv,
  readServerEnv,
  readToolEnv,
  type ServerEnv,
} from "@/config/env.ts";
import { MENSAJE_HTTP, TEXTO_ENV, TEXTO_HTTP } from "@/config/strings.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { requireAccess } from "@/http/middlewares/access.middleware.ts";
import { resolveClientIp } from "@/http/middlewares/client-ip.middleware.ts";
import { requireJson } from "@/http/middlewares/json-only.middleware.ts";
import { limitByClientIp } from "@/http/middlewares/rate-limit.middleware.ts";
import { registerAccessRoute } from "@/http/routes/access.route.ts";
import { registerChatRoute } from "@/http/routes/chat.route.ts";
import { registerConfigRoute } from "@/http/routes/config.route.ts";
import { registerHealthRoute } from "@/http/routes/health.route.ts";
import { registerSessionsRoute } from "@/http/routes/sessions.route.ts";
import { registerStaticRoutes } from "@/http/routes/static.route.ts";
import { createRateLimiter } from "@/http/services/rate-limiter.service.ts";
import { createTurnSlots } from "@/http/services/turn-slots.service.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type {
  AccessSettings,
  ConfigSource,
  HttpEnv,
  RateLimiter,
  ServerCreation,
  ServerOptions,
  ServerStart,
} from "@/http/types/server.type.ts";
import { clockFromToolEnv, systemClock } from "@/infra/clock/clock.adapter.ts";
import { listCases } from "@/infra/fixtures/case-resolver.adapter.ts";
import { resolveRoot } from "@/infra/fixtures/fixtures-reader.adapter.ts";
import { createLogger } from "@/infra/logging/logger.adapter.ts";
import type { OpcionesAgente } from "@/loop/types/agente.type.ts";
import { crearAgente, secretosDelAgente } from "@/loop/wiring/agente.wiring.ts";

function readEnv(options: ServerOptions) {
  return options.envSource === undefined ? readServerEnv() : parseServerEnv(options.envSource);
}

function readAgentConfig(options: ServerOptions) {
  return options.envSource === undefined ? readAgentEnv() : parseAgentEnv(options.envSource);
}

function agentOptions(options: ServerOptions, accessSecrets: readonly string[]): OpcionesAgente {
  return {
    directorio: options.rootDirectory,
    secretosAdicionales: accessSecrets,
    fetch: options.fetch,
    ...(options.envSource === undefined ? {} : { fuenteEntorno: options.envSource }),
    ...(options.wait === undefined ? {} : { esperar: options.wait }),
    ...(options.logDestination === undefined ? {} : { destinoLogs: options.logDestination }),
    ...(options.now === undefined ? {} : { ahora: options.now }),
  };
}

function ephemeralTokenSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(BYTES_SECRETO_TOKEN));
  return Buffer.from(bytes).toString(CODIFICACION_SECRETO_TOKEN);
}

function clockOf(options: ServerOptions): () => number {
  return options.now ?? Date.now;
}

function accessSettings(env: ServerEnv, options: ServerOptions): AccessSettings {
  const now = clockOf(options);
  return {
    code: env.ACCESS_CODE,
    tokenSecret: env.ACCESS_TOKEN_SECRET ?? ephemeralTokenSecret(),
    ttlMs: env.ACCESS_TOKEN_TTL_HOURS * MS_POR_HORA,
    secureCookie: env.NODE_ENV !== ENTORNO_APP.DESARROLLO,
    now,
    failedAttempts: createRateLimiter({
      limit: env.ACCESS_MAX_FAILED_ATTEMPTS,
      windowMs: env.ACCESS_FAILED_WINDOW_MINUTES * MS_POR_MINUTO,
      now,
    }),
    lockedMessage: TEXTO_HTTP.demasiadosIntentos(env.ACCESS_FAILED_WINDOW_MINUTES),
  };
}

function chatMessagesLimiter(env: ServerEnv, options: ServerOptions): RateLimiter {
  return createRateLimiter({
    limit: env.RATE_LIMIT_CHAT_PER_MINUTE,
    windowMs: VENTANA_MENSAJES_CHAT_MINUTOS * MS_POR_MINUTO,
    now: clockOf(options),
  });
}

function newSessionsLimiter(env: ServerEnv, options: ServerOptions): RateLimiter {
  return createRateLimiter({
    limit: env.NEW_SESSIONS_PER_HOUR,
    windowMs: VENTANA_SESIONES_NUEVAS_HORAS * MS_POR_HORA,
    now: clockOf(options),
  });
}

function sharedTokenSecretReason(): string {
  return formatearIssues(
    [{ path: [VARIABLE_SECRETO_TOKEN], message: TEXTO_ENV.secretoTokenRepetido }],
    MAX_ISSUES_ARGS,
  );
}

function httpLogger(options: ServerOptions, config: AgentEnv, secrets: readonly string[]) {
  const destination = options.logDestination === undefined ? {} : { destination: options.logDestination };
  return createLogger({ level: config.logLevel, secrets, ...destination });
}

function businessCalendar() {
  const toolEnv = readToolEnv();
  if (!toolEnv.success) {
    return { clock: systemClock(ZONA_HORARIA_POR_DEFECTO), zone: ZONA_HORARIA_POR_DEFECTO };
  }
  return { clock: clockFromToolEnv(toolEnv.data), zone: toolEnv.data.TZ_NEGOCIO };
}

function configSource(rootDirectory: string, config: AgentEnv, env: ServerEnv): ConfigSource {
  const root = resolveRoot(rootDirectory);
  return async () => {
    const { clock, zone } = businessCalendar();
    return {
      fechaEjecucion: clock.hoy(),
      zona: zone,
      casos: await listCases(root),
      presupuestoSesion: config.sessionTokenBudget,
      mensajeMaximo: env.MAX_MESSAGE_CHARS,
    };
  };
}

function notFound(c: Context<HttpEnv>): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.rutaNoEncontrada };
  return c.json(body, RESPUESTA_HTTP.NO_ENCONTRADO);
}

function webDirectory(options: ServerOptions): string {
  return resolve(options.webDirectory ?? resolve(options.rootDirectory, DIRECTORIO_WEB_DIST));
}

function securityHeaders() {
  const own = () => [FUENTE_CSP.PROPIA];
  const none = () => [FUENTE_CSP.NINGUNA];
  return secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: own(),
      scriptSrc: own(),
      styleSrc: own(),
      connectSrc: own(),
      imgSrc: [FUENTE_CSP.PROPIA, FUENTE_CSP.DATA],
      fontSrc: own(),
      objectSrc: none(),
      frameAncestors: none(),
      baseUri: own(),
      formAction: own(),
    },
  });
}

function bodyTooLarge(c: Context<HttpEnv>): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.cuerpoDemasiadoGrande };
  return c.json(body, RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
}

function registerFallbackHandlers(app: Hono<HttpEnv>, logger: BitacoraEstructurada): void {
  app.notFound(notFound);
  app.onError((error, c) => {
    logger.error(EVENTO_HTTP.ERROR_NO_CONTROLADO, { error, path: c.req.path });
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.errorInterno };
    return c.json(body, RESPUESTA_HTTP.ERROR_INTERNO);
  });
}

export function createServer(options: ServerOptions): ServerCreation {
  const env = readEnv(options);
  if (!env.success) return { ok: false, mensaje: formatearIssues(env.error.issues, MAX_ISSUES_ARGS) };
  const access = accessSettings(env.data, options);
  const creation = crearAgente(agentOptions(options, [access.code, access.tokenSecret]));
  if (!creation.ok && creation.codigo !== CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE) {
    return { ok: false, mensaje: creation.mensaje };
  }
  const agente = creation.ok ? creation.agente : null;
  const config = readAgentConfig(options);
  if (!config.success) return { ok: false, mensaje: formatearIssues(config.error.issues, MAX_ISSUES_ARGS) };
  const agentSecrets = secretosDelAgente(config.data);
  if (agentSecrets.includes(access.tokenSecret)) return { ok: false, mensaje: sharedTokenSecretReason() };
  const secrets = [...agentSecrets, access.code, access.tokenSecret];
  const logger = httpLogger(options, config.data, secrets);
  const app = new Hono<HttpEnv>();
  registerFallbackHandlers(app, logger);
  app.use(RUTA_COMODIN, securityHeaders());
  app.use(RUTA_API_PROTEGIDA, resolveClientIp({ trustedHops: env.data.TRUSTED_PROXY_HOPS, logger }));
  app.use(
    RUTA_API_PROTEGIDA,
    requireJson(),
    bodyLimit({ maxSize: env.data.MAX_BODY_BYTES, onError: bodyTooLarge }),
  );
  registerHealthRoute(app, {
    provider: config.data.primary.provider,
    model: config.data.primary.model,
    agente,
  });
  registerAccessRoute(app, access);
  app.use(RUTA_API_PROTEGIDA, requireAccess(access));
  registerConfigRoute(app, configSource(options.rootDirectory, config.data, env.data));
  registerSessionsRoute(app, { agente });
  app.post(
    RUTA_API.CHAT,
    limitByClientIp(chatMessagesLimiter(env.data, options), MENSAJE_HTTP.demasiadosMensajes),
  );
  registerChatRoute(app, {
    agente,
    secrets,
    logger,
    heartbeatMs: options.heartbeatMs ?? LATIDO_SSE_MS,
    maxMessageChars: env.data.MAX_MESSAGE_CHARS,
    turnSlots: createTurnSlots(env.data.MAX_CONCURRENT_TURNS),
    newSessions: newSessionsLimiter(env.data, options),
    businessZone: () => businessCalendar().zone,
  });
  registerStaticRoutes(app, { webDirectory: webDirectory(options) });
  return { ok: true, app, port: env.data.PORT };
}

export function startServer(rootDirectory: string): ServerStart {
  const creation = createServer({ rootDirectory, fetch });
  if (!creation.ok) return creation;
  const server = Bun.serve({ hostname: HOST_SERVIDOR, port: creation.port, fetch: creation.app.fetch });
  return { ok: true, url: server.url.href };
}
