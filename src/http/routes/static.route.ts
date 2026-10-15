import type { Hono, MiddlewareHandler } from "hono";
import { serveStatic } from "hono/bun";
import { ARCHIVO_INDEX_WEB, PREFIJO_API, RUTA_COMODIN } from "@/config/constants/http.constants.ts";
import type { HttpEnv, StaticSettings } from "@/http/types/server.type.ts";

function isApiPath(path: string): boolean {
  return path === PREFIJO_API || path.startsWith(`${PREFIJO_API}/`);
}

function outsideApi(handler: MiddlewareHandler): MiddlewareHandler<HttpEnv> {
  return async (c, next) => (isApiPath(c.req.path) ? next() : handler(c, next));
}

export function registerStaticRoutes(app: Hono<HttpEnv>, settings: StaticSettings): void {
  app.get(RUTA_COMODIN, outsideApi(serveStatic({ root: settings.webDirectory })));
  app.get(RUTA_COMODIN, outsideApi(serveStatic({ root: settings.webDirectory, path: ARCHIVO_INDEX_WEB })));
}
