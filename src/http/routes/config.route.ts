import type { Hono } from "hono";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import type { ConfigResponse } from "@/http/types/api.type.ts";
import type { ConfigSource, HttpEnv } from "@/http/types/server.type.ts";

export function registerConfigRoute(app: Hono<HttpEnv>, source: ConfigSource): void {
  app.get(RUTA_API.CONFIG, async (c) => {
    const body: ConfigResponse = await source();
    return c.json(body, RESPUESTA_HTTP.OK);
  });
}
