import type { Context, Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import {
  CABECERA,
  EVENTO_HTTP,
  RESPUESTA_HTTP,
  RUTA_API,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { chatBodySchema } from "@/http/schemas/chat-body.schema.ts";
import { startHeartbeat, toSseFrame } from "@/http/services/sse.service.ts";
import type { ChatBody, ErrorResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";
import type { Agente } from "@/loop/types/agente.type.ts";

type ChatDeps = {
  readonly agente: Agente;
  readonly secrets: readonly string[];
  readonly logger: BitacoraEstructurada;
  readonly heartbeatMs: number;
};

async function readBody(c: Context<HttpEnv>): Promise<ChatBody | null> {
  try {
    const parsed = chatBodySchema.safeParse(await c.req.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function invalidBody(c: Context<HttpEnv>): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.cuerpoInvalido };
  return c.json(body, RESPUESTA_HTTP.PEDIDO_INVALIDO);
}

function internalErrorData(): string {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.errorInterno };
  return JSON.stringify(body);
}

function streamTurn(c: Context<HttpEnv>, body: ChatBody, deps: ChatDeps): Response {
  const response = streamSSE(c, async (stream) => {
    const cut = new AbortController();
    stream.onAbort(() => cut.abort());
    const stopHeartbeat = startHeartbeat((comment) => stream.write(comment), deps.heartbeatMs);
    try {
      const turn = deps.agente.turno({ sesionId: body.sessionId, mensaje: body.message, signal: cut.signal });
      for await (const evento of turn) await stream.writeSSE(toSseFrame(evento, deps.secrets));
    } catch (error) {
      deps.logger.error(EVENTO_HTTP.STREAM_FALLIDO, { error });
      await stream.writeSSE({ event: TIPO_EVENTO.ERROR, data: internalErrorData() });
    } finally {
      stopHeartbeat();
    }
  });
  response.headers.set(CABECERA.CACHE_CONTROL, VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION);
  response.headers.set(CABECERA.X_ACCEL_BUFFERING, VALOR_CABECERA.SIN_BUFFER);
  return response;
}

export function registerChatRoute(app: Hono<HttpEnv>, deps: ChatDeps): void {
  app.post(RUTA_API.CHAT, async (c) => {
    c.env.timeout(c.req.raw, 0);
    const body = await readBody(c);
    if (body === null) return invalidBody(c);
    return streamTurn(c, body, deps);
  });
}
