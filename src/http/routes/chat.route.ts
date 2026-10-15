import type { Context, Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import { CODIGO_AGENTE, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import {
  CABECERA,
  EVENTO_HTTP,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE, MENSAJE_HTTP } from "@/config/strings.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import { chatBodySchema } from "@/http/schemas/chat-body.schema.ts";
import { startHeartbeat, toSseFrame } from "@/http/services/sse.service.ts";
import type { ChatBody, ChatJsonResponse, ErrorResponse } from "@/http/types/api.type.ts";
import type { HttpEnv, TurnSlots } from "@/http/types/server.type.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

type ChatDeps = {
  readonly agente: Agente | null;
  readonly secrets: readonly string[];
  readonly logger: BitacoraEstructurada;
  readonly heartbeatMs: number;
  readonly maxMessageChars: number;
  readonly turnSlots: TurnSlots;
  businessZone(): string;
};

type TurnDeps = ChatDeps & { readonly agente: Agente };

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

function messageTooLong(c: Context<HttpEnv>, maxMessageChars: number): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.mensajeDemasiadoLargo(maxMessageChars) };
  return c.json(body, RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
}

function missingProviderKey(c: Context<HttpEnv>): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE] };
  return c.json(body, RESPUESTA_HTTP.NO_DISPONIBLE);
}

function dailyCapReached(c: Context<HttpEnv>, zone: string): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.topeDiario(zone) };
  return c.json(body, RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
}

function serverBusy(c: Context<HttpEnv>): Response {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.servidorOcupado };
  return c.json(body, RESPUESTA_HTTP.NO_DISPONIBLE);
}

function internalErrorData(): string {
  const body: ErrorResponse = { mensaje: MENSAJE_HTTP.errorInterno };
  return JSON.stringify(body);
}

function streamTurn(c: Context<HttpEnv>, body: ChatBody, deps: TurnDeps): Response {
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
      deps.turnSlots.release();
    }
  });
  response.headers.set(CABECERA.CACHE_CONTROL, VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION);
  response.headers.set(CABECERA.X_ACCEL_BUFFERING, VALOR_CABECERA.SIN_BUFFER);
  return response;
}

function wantsJson(c: Context<HttpEnv>): boolean {
  const accept = c.req.header(CABECERA.ACCEPT) ?? "";
  return accept.includes(TIPO_CONTENIDO.JSON) && !accept.includes(TIPO_CONTENIDO.SSE);
}

function sessionIdOf(eventos: readonly EventoAgente[]): string | null {
  const inicio = eventos.find((evento) => evento.tipo === TIPO_EVENTO.INICIO_TURNO);
  return inicio?.tipo === TIPO_EVENTO.INICIO_TURNO ? inicio.sesionId : null;
}

async function foldTurn(c: Context<HttpEnv>, body: ChatBody, deps: TurnDeps): Promise<EventoAgente[]> {
  const eventos: EventoAgente[] = [];
  const turn = deps.agente.turno({
    sesionId: body.sessionId,
    mensaje: body.message,
    signal: c.req.raw.signal,
  });
  try {
    for await (const evento of turn) eventos.push(evento);
  } finally {
    deps.turnSlots.release();
  }
  return eventos;
}

async function jsonTurn(c: Context<HttpEnv>, body: ChatBody, deps: TurnDeps): Promise<Response> {
  const eventos = await foldTurn(c, body, deps);
  const reply: ChatJsonResponse = { sessionId: sessionIdOf(eventos), ...respuestaDeTurno(eventos) };
  return c.json(redactar(reply, deps.secrets), RESPUESTA_HTTP.OK);
}

export function registerChatRoute(app: Hono<HttpEnv>, deps: ChatDeps): void {
  app.post(RUTA_API.CHAT, async (c) => {
    c.env.timeout(c.req.raw, 0);
    const body = await readBody(c);
    if (body === null) return invalidBody(c);
    if (body.message.length > deps.maxMessageChars) return messageTooLong(c, deps.maxMessageChars);
    const { agente } = deps;
    if (agente === null) return missingProviderKey(c);
    if (agente.estadoLlm() === ESTADO_LLM.TOPE_DIARIO) return dailyCapReached(c, deps.businessZone());
    if (!deps.turnSlots.tryAcquire()) return serverBusy(c);
    const turnDeps: TurnDeps = { ...deps, agente };
    return wantsJson(c) ? jsonTurn(c, body, turnDeps) : streamTurn(c, body, turnDeps);
  });
}
