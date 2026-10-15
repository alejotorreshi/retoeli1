import type { MiddlewareHandler } from "hono";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { HttpEnv, RateLimiter } from "@/http/types/server.type.ts";

export function limitByClientIp(limiter: RateLimiter, mensaje: string): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    if (limiter.hit(c.get("clientIp"))) return next();
    const body: ErrorResponse = { mensaje };
    return c.json(body, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
  };
}
