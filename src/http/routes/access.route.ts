import type { Context, Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { timingSafeEqual } from "hono/utils/buffer";
import {
  CABECERA,
  NOMBRE_COOKIE_ACCESO,
  RESPUESTA_HTTP,
  RESULTADO_RESERVA,
  RUTA_API,
  RUTA_COOKIE,
  SAME_SITE_COOKIE,
  SEGUNDOS_REINTENTO_INTENTO_EN_CURSO,
} from "@/config/constants/http.constants.ts";
import { MS_POR_SEGUNDO } from "@/config/constants/runtime.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { accessBodySchema } from "@/http/schemas/access-body.schema.ts";
import { issueAccessToken } from "@/http/services/access-token.service.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { AccessSettings, HttpEnv, Reservation } from "@/http/types/server.type.ts";

async function readCode(c: Context<HttpEnv>): Promise<string | null> {
  try {
    const parsed = accessBodySchema.safeParse(await c.req.json());
    return parsed.success ? parsed.data.codigo : null;
  } catch {
    return null;
  }
}

type RejectStatus =
  | typeof RESPUESTA_HTTP.PEDIDO_INVALIDO
  | typeof RESPUESTA_HTTP.NO_AUTORIZADO
  | typeof RESPUESTA_HTTP.DEMASIADOS_PEDIDOS;

function reject(c: Context<HttpEnv>, mensaje: string, status: RejectStatus): Response {
  const body: ErrorResponse = { mensaje };
  return c.json(body, status);
}

async function grantAccess(c: Context<HttpEnv>, access: AccessSettings): Promise<Response> {
  await setSignedCookie(
    c,
    NOMBRE_COOKIE_ACCESO,
    issueAccessToken(access.now(), access.ttlMs),
    access.signingKey,
    {
      httpOnly: true,
      secure: access.secureCookie,
      sameSite: SAME_SITE_COOKIE,
      path: RUTA_COOKIE,
      maxAge: Math.floor(access.ttlMs / MS_POR_SEGUNDO),
    },
  );
  return c.body(null, RESPUESTA_HTTP.SIN_CONTENIDO);
}

function rejectReservation(c: Context<HttpEnv>, access: AccessSettings, reservation: Reservation): Response {
  if (reservation === RESULTADO_RESERVA.BLOQUEADO) {
    return reject(c, access.lockedMessage, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
  }
  c.header(CABECERA.REINTENTAR_TRAS, String(SEGUNDOS_REINTENTO_INTENTO_EN_CURSO));
  return reject(c, MENSAJE_HTTP.intentoEnCurso, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
}

export function registerAccessRoute(app: Hono<HttpEnv>, access: AccessSettings): void {
  app.post(RUTA_API.ACCESO, async (c) => {
    const clientIp = c.get("clientIp");
    const reservation = access.failedAttempts.reserve(clientIp);
    if (reservation !== RESULTADO_RESERVA.RESERVADO) return rejectReservation(c, access, reservation);
    const codigo = await readCode(c);
    if (codigo === null) {
      access.failedAttempts.release(clientIp);
      return reject(c, MENSAJE_HTTP.cuerpoAccesoInvalido, RESPUESTA_HTTP.PEDIDO_INVALIDO);
    }
    if (!(await timingSafeEqual(codigo, access.code))) {
      access.failedAttempts.confirmFailure(clientIp);
      return reject(c, MENSAJE_HTTP.codigoInvalido, RESPUESTA_HTTP.NO_AUTORIZADO);
    }
    access.failedAttempts.release(clientIp);
    return grantAccess(c, access);
  });
}
