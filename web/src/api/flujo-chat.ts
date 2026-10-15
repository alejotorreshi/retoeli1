import { pedir, resultadoDelRechazo } from "@web/api/cliente-api.ts";
import { ACCION_UI, PEDIDO_JSON, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import type { Despachar } from "@web/types/chat.type.ts";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RUTA_API } from "@/config/constants/http.constants.ts";
import type { ChatBody, SseEvent } from "@/http/types/api.type.ts";

const TIPOS_DE_EVENTO: ReadonlySet<string> = new Set(Object.values(TIPO_EVENTO));

function esEventoDelServidor(valor: unknown, nombre: string | undefined): valor is SseEvent {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "tipo" in valor &&
    typeof valor.tipo === "string" &&
    valor.tipo === nombre &&
    TIPOS_DE_EVENTO.has(valor.tipo)
  );
}

function eventoDelServidor(nombre: string | undefined, datos: string): SseEvent | null {
  try {
    const valor: unknown = JSON.parse(datos);
    return esEventoDelServidor(valor, nombre) ? valor : null;
  } catch {
    return null;
  }
}

async function despacharEventos(
  cuerpo: NonNullable<Response["body"]>,
  despachar: Despachar,
): Promise<boolean> {
  const lector = cuerpo
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader();
  let turnoTerminado = false;
  for (let lectura = await lector.read(); !lectura.done; lectura = await lector.read()) {
    const evento = eventoDelServidor(lectura.value.event, lectura.value.data);
    if (evento === null) continue;
    despachar({ tipo: ACCION_UI.EVENTO, evento });
    if (evento.tipo === TIPO_EVENTO.FIN_TURNO) turnoTerminado = true;
  }
  return turnoTerminado;
}

async function leerEventos(cuerpo: NonNullable<Response["body"]>, despachar: Despachar): Promise<boolean> {
  try {
    return await despacharEventos(cuerpo, despachar);
  } catch {
    return false;
  }
}

async function informarRechazo(respuesta: Response, despachar: Despachar): Promise<void> {
  const rechazo = await resultadoDelRechazo(respuesta);
  if (rechazo.tipo === RESULTADO_API.SIN_RED) {
    despachar({ tipo: ACCION_UI.ERROR_RED });
    return;
  }
  despachar({ tipo: ACCION_UI.ERROR_HTTP, status: respuesta.status, mensaje: rechazo.mensaje });
}

function cuerpoDelPedido({ sessionId, message, accion }: ChatBody): string {
  return JSON.stringify(accion === undefined ? { sessionId, message } : { sessionId, message, accion });
}

export async function enviarMensaje(
  pedido: ChatBody,
  despachar: Despachar,
  signal: AbortSignal,
): Promise<void> {
  const respuesta = await pedir(RUTA_API.CHAT, { ...PEDIDO_JSON, body: cuerpoDelPedido(pedido), signal });
  if (signal.aborted) return;
  if (respuesta === null) {
    despachar({ tipo: ACCION_UI.ERROR_RED });
    return;
  }
  if (!respuesta.ok) {
    await informarRechazo(respuesta, despachar);
    return;
  }
  despachar({ tipo: ACCION_UI.ACEPTADO, mensaje: pedido.message });
  const turnoTerminado = respuesta.body === null ? false : await leerEventos(respuesta.body, despachar);
  if (!turnoTerminado && !signal.aborted) despachar({ tipo: ACCION_UI.FIN_STREAM });
}

export async function enviarTurno(
  pedido: ChatBody,
  despachar: Despachar,
  signal: AbortSignal,
  alTerminarTurno: () => void,
): Promise<void> {
  try {
    await enviarMensaje(pedido, despachar, signal);
  } finally {
    alTerminarTurno();
  }
}
