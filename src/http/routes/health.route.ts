import type { Hono } from "hono";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";
import type { Agente } from "@/loop/types/agente.type.ts";

type HealthDeps = {
  readonly provider: string;
  readonly model: string;
  readonly agente: Pick<Agente, "estadoLlm"> | null;
};

export function registerHealthRoute(app: Hono<HttpEnv>, deps: HealthDeps): void {
  app.get(RUTA_API.SALUD, (c) => {
    const body: HealthResponse = {
      ok: true,
      provider: deps.provider,
      model: deps.model,
      llm: deps.agente === null ? ESTADO_LLM.SIN_CLAVE : deps.agente.estadoLlm(),
    };
    return c.json(body, RESPUESTA_HTTP.OK);
  });
}
