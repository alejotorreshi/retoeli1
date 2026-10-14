import type { Hono } from "hono";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";

export function registerHealthRoute(app: Hono<HttpEnv>, identity: Omit<HealthResponse, "ok">): void {
  app.get(RUTA_API.SALUD, (c) => {
    const body: HealthResponse = { ok: true, provider: identity.provider, model: identity.model };
    return c.json(body, RESPUESTA_HTTP.OK);
  });
}
