import type { Context, MiddlewareHandler } from "hono";
import { getSignedCookie } from "hono/cookie";
import { timingSafeEqual } from "hono/utils/buffer";
import {
  CABECERA,
  NOMBRE_COOKIE_ACCESO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
  RESULTADO_BEARER,
  RESULTADO_RESERVA,
  SEGUNDOS_REINTENTO_INTENTO_EN_CURSO,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { isAccessTokenValid } from "@/http/services/access-token.service.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { AccessSettings, BearerCheck, HttpEnv } from "@/http/types/server.type.ts";

async function checkBearer(c: Context<HttpEnv>, access: AccessSettings): Promise<BearerCheck> {
  const header = c.req.header(CABECERA.AUTORIZACION);
  if (header === undefined || !header.startsWith(PREFIJO_BEARER)) return RESULTADO_BEARER.AUSENTE;
  const clientIp = c.get("clientIp");
  const reservation = access.failedAttempts.reserve(clientIp);
  if (reservation === RESULTADO_RESERVA.BLOQUEADO) return RESULTADO_BEARER.BLOQUEADO;
  if (reservation === RESULTADO_RESERVA.OCUPADO) return RESULTADO_BEARER.OCUPADO;
  const presented = header.slice(PREFIJO_BEARER.length);
  if (!(await timingSafeEqual(presented, access.code))) {
    access.failedAttempts.confirmFailure(clientIp);
    return RESULTADO_BEARER.INVALIDO;
  }
  access.failedAttempts.release(clientIp);
  return RESULTADO_BEARER.VALIDO;
}

function tooManyAttempts(c: Context<HttpEnv>, mensaje: string): Response {
  const body: ErrorResponse = { mensaje };
  return c.json(body, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
}

function attemptsInProgress(c: Context<HttpEnv>): Response {
  c.header(CABECERA.REINTENTAR_TRAS, String(SEGUNDOS_REINTENTO_INTENTO_EN_CURSO));
  return tooManyAttempts(c, MENSAJE_HTTP.intentoEnCurso);
}

export function requireAccess(access: AccessSettings): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    const bearer = await checkBearer(c, access);
    if (bearer === RESULTADO_BEARER.VALIDO) return next();
    if (bearer === RESULTADO_BEARER.BLOQUEADO) return tooManyAttempts(c, access.lockedMessage);
    if (bearer === RESULTADO_BEARER.OCUPADO) return attemptsInProgress(c);
    const token = await getSignedCookie(c, access.signingKey, NOMBRE_COOKIE_ACCESO);
    if (typeof token === "string" && isAccessTokenValid(token, access.now())) return next();
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.accesoVencido };
    return c.json(body, RESPUESTA_HTTP.NO_AUTORIZADO);
  };
}
