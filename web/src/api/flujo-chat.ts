import { ACCION_UI, PEDIDO_CHAT } from "@web/config/constants/ui.constants.ts";
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

async function leerEventos(cuerpo: NonNullable<Response["body"]>, despachar: Despachar): Promise<void> {
  const lector = cuerpo
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader();
  for (let lectura = await lector.read(); !lectura.done; lectura = await lector.read()) {
    const evento = eventoDelServidor(lectura.value.event, lectura.value.data);
    if (evento !== null) despachar({ tipo: ACCION_UI.EVENTO, evento });
  }
}

export async function enviarMensaje(
  pedido: ChatBody,
  despachar: Despachar,
  signal: AbortSignal,
): Promise<void> {
  const respuesta = await fetch(RUTA_API.CHAT, { ...PEDIDO_CHAT, body: JSON.stringify(pedido), signal });
  if (respuesta.body === null) return;
  await leerEventos(respuesta.body, despachar);
}
