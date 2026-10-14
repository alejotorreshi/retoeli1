import { Hono } from "hono";
import { HOST_SERVIDOR } from "@/config/constants/http.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { parseServerEnv, readServerEnv } from "@/config/env.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { registerHealthRoute } from "@/http/routes/health.route.ts";
import type { HttpEnv, ServerCreation, ServerOptions, ServerStart } from "@/http/types/server.type.ts";
import type { OpcionesAgente } from "@/loop/types/agente.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

function readEnv(options: ServerOptions) {
  return options.envSource === undefined ? readServerEnv() : parseServerEnv(options.envSource);
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

export function createServer(options: ServerOptions): ServerCreation {
  const env = readEnv(options);
  if (!env.success) return { ok: false, mensaje: formatearIssues(env.error.issues, MAX_ISSUES_ARGS) };
  const creation = crearAgente(agentOptions(options));
  if (!creation.ok) return { ok: false, mensaje: creation.mensaje };
  const app = new Hono<HttpEnv>();
  registerHealthRoute(app, { provider: creation.agente.proveedor, model: creation.agente.modelo });
  return { ok: true, app, port: env.data.PORT };
}

export function startServer(rootDirectory: string): ServerStart {
  const creation = createServer({ rootDirectory, fetch });
  if (!creation.ok) return creation;
  const server = Bun.serve({ hostname: HOST_SERVIDOR, port: creation.port, fetch: creation.app.fetch });
  return { ok: true, url: server.url.href };
}
