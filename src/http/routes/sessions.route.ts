import type { Hono } from "hono";
import { PARAMETRO_SESION, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { TEXTO_SESION } from "@/config/strings.ts";
import type { ErrorResponse, SessionViewResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";
import type { Agente } from "@/loop/types/agente.type.ts";

type SessionsDeps = {
  readonly agente: Pick<Agente, "consultarSesion"> | null;
};

export function registerSessionsRoute(app: Hono<HttpEnv>, deps: SessionsDeps): void {
  app.get(RUTA_API.SESION, (c) => {
    const view = deps.agente?.consultarSesion(c.req.param(PARAMETRO_SESION)) ?? null;
    if (view === null) {
      const body: ErrorResponse = { mensaje: TEXTO_SESION.expirada };
      return c.json(body, RESPUESTA_HTTP.NO_ENCONTRADO);
    }
    const body: SessionViewResponse = view;
    return c.json(body, RESPUESTA_HTTP.OK);
  });
}
