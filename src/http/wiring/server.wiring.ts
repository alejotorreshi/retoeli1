import { Hono } from "hono";
import { HOST_SERVIDOR, LATIDO_SSE_MS } from "@/config/constants/http.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { type AgentEnv, parseAgentEnv, parseServerEnv, readAgentEnv, readServerEnv } from "@/config/env.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { registerChatRoute } from "@/http/routes/chat.route.ts";
import { registerHealthRoute } from "@/http/routes/health.route.ts";
import type { HttpEnv, ServerCreation, ServerOptions, ServerStart } from "@/http/types/server.type.ts";
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

function httpLogger(options: ServerOptions, config: AgentEnv, secrets: readonly string[]) {
  const destination = options.logDestination === undefined ? {} : { destination: options.logDestination };
  return createLogger({ level: config.logLevel, secrets, ...destination });
}

export function createServer(options: ServerOptions): ServerCreation {
  const env = readEnv(options);
  if (!env.success) return { ok: false, mensaje: formatearIssues(env.error.issues, MAX_ISSUES_ARGS) };
  const creation = crearAgente(agentOptions(options));
  if (!creation.ok) return { ok: false, mensaje: creation.mensaje };
  const config = readAgentConfig(options);
  if (!config.success) return { ok: false, mensaje: formatearIssues(config.error.issues, MAX_ISSUES_ARGS) };
  const secrets = secretosDelAgente(config.data);
  const logger = httpLogger(options, config.data, secrets);
  const app = new Hono<HttpEnv>();
  registerHealthRoute(app, { provider: creation.agente.proveedor, model: creation.agente.modelo });
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
