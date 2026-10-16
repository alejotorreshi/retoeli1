import type { Context, MiddlewareHandler } from "hono";
import { getSignedCookie } from "hono/cookie";
import { timingSafeEqual } from "hono/utils/buffer";
import {
  CABECERA,
  NOMBRE_COOKIE_ACCESO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
  RESULTADO_BEARER,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { isAccessTokenValid } from "@/http/services/access-token.service.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { AccessSettings, BearerCheck, HttpEnv } from "@/http/types/server.type.ts";

async function checkBearer(c: Context<HttpEnv>, access: AccessSettings): Promise<BearerCheck> {
  const header = c.req.header(CABECERA.AUTORIZACION);
  if (header === undefined || !header.startsWith(PREFIJO_BEARER)) return RESULTADO_BEARER.AUSENTE;
  const clientIp = c.get("clientIp");
  if (!access.failedAttempts.hit(clientIp)) return RESULTADO_BEARER.BLOQUEADO;
  const presented = header.slice(PREFIJO_BEARER.length);
  if (!(await timingSafeEqual(presented, access.code))) return RESULTADO_BEARER.INVALIDO;
  access.failedAttempts.release(clientIp);
  return RESULTADO_BEARER.VALIDO;
}

export function requireAccess(access: AccessSettings): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    const bearer = await checkBearer(c, access);
    if (bearer === RESULTADO_BEARER.VALIDO) return next();
    if (bearer === RESULTADO_BEARER.BLOQUEADO) {
      const locked: ErrorResponse = { mensaje: access.lockedMessage };
      return c.json(locked, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
    }
    const token = await getSignedCookie(c, access.signingKey, NOMBRE_COOKIE_ACCESO);
    if (typeof token === "string" && isAccessTokenValid(token, access.now())) return next();
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.accesoVencido };
    return c.json(body, RESPUESTA_HTTP.NO_AUTORIZADO);
  };
}
