import { ACCION_UI, PEDIDO_CHAT } from "@web/config/constants/ui.constants.ts";
import type { Despachar } from "@web/types/chat.type.ts";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RUTA_API } from "@/config/constants/http.constants.ts";
import type { ChatBody, ErrorResponse, SseEvent } from "@/http/types/api.type.ts";

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

function esErrorDelServidor(valor: unknown): valor is ErrorResponse {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "mensaje" in valor &&
    typeof valor.mensaje === "string" &&
    valor.mensaje.trim().length > 0
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

async function mensajeDelRechazo(respuesta: Response): Promise<string | null> {
  try {
    const valor: unknown = await respuesta.json();
    return esErrorDelServidor(valor) ? valor.mensaje : null;
  } catch {
    return null;
  }
}

async function pedirChat(pedido: ChatBody, signal: AbortSignal): Promise<Response | null> {
  try {
    return await fetch(RUTA_API.CHAT, { ...PEDIDO_CHAT, body: JSON.stringify(pedido), signal });
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
  const mensaje = await mensajeDelRechazo(respuesta);
  if (mensaje === null) {
    despachar({ tipo: ACCION_UI.ERROR_RED });
    return;
  }
  despachar({ tipo: ACCION_UI.ERROR_HTTP, status: respuesta.status, mensaje });
}

export async function enviarMensaje(
  pedido: ChatBody,
  despachar: Despachar,
  signal: AbortSignal,
): Promise<void> {
  const respuesta = await pedirChat(pedido, signal);
  if (signal.aborted) return;
  if (respuesta === null) {
    despachar({ tipo: ACCION_UI.ERROR_RED });
    return;
  }
  if (!respuesta.ok) {
    await informarRechazo(respuesta, despachar);
    return;
  }
  const turnoTerminado = respuesta.body === null ? false : await leerEventos(respuesta.body, despachar);
  if (!turnoTerminado && !signal.aborted) despachar({ tipo: ACCION_UI.FIN_STREAM });
}
