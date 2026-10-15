import type { MiddlewareHandler } from "hono";
import { getSignedCookie } from "hono/cookie";
import { timingSafeEqual } from "hono/utils/buffer";
import {
  CABECERA,
  NOMBRE_COOKIE_ACCESO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { isAccessTokenValid } from "@/http/services/access-token.service.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { AccessSettings, HttpEnv } from "@/http/types/server.type.ts";

async function bearerMatches(header: string | undefined, code: string): Promise<boolean> {
  if (header === undefined || !header.startsWith(PREFIJO_BEARER)) return false;
  return timingSafeEqual(header.slice(PREFIJO_BEARER.length), code);
}

export function requireAccess(access: AccessSettings): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    if (await bearerMatches(c.req.header(CABECERA.AUTORIZACION), access.code)) return next();
    const token = await getSignedCookie(c, access.tokenSecret, NOMBRE_COOKIE_ACCESO);
    if (typeof token === "string" && isAccessTokenValid(token, access.now())) return next();
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.accesoVencido };
    return c.json(body, RESPUESTA_HTTP.NO_AUTORIZADO);
  };
}
