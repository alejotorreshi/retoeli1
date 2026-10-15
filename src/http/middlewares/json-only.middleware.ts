import type { MiddlewareHandler } from "hono";
import { CABECERA, METODO_POST, RESPUESTA_HTTP, TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { ErrorResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";

function isJson(contentType: string | undefined): boolean {
  return contentType?.trim().toLowerCase().startsWith(TIPO_CONTENIDO.JSON) ?? false;
}

export function requireJson(): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    if (c.req.method !== METODO_POST || isJson(c.req.header(CABECERA.TIPO_CONTENIDO))) return next();
    const body: ErrorResponse = { mensaje: MENSAJE_HTTP.tipoNoSoportado };
    return c.json(body, RESPUESTA_HTTP.TIPO_NO_SOPORTADO);
  };
}
