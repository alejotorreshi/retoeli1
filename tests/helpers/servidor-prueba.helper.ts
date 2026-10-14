import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import type {
  FrameSse,
  LecturaSse,
  OpcionesServidorPrueba,
  ServidorPrueba,
} from "@tests/helpers/types/servidor-prueba.type.ts";
import { type EventSourceMessage, EventSourceParserStream } from "eventsource-parser/stream";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import type { HttpBindings } from "@/http/types/server.type.ts";
import { createServer } from "@/http/wiring/server.wiring.ts";
import type { EventoAgente, EventoInicioTurno } from "@/loop/types/evento.type.ts";

export const BINDINGS_PRUEBA: HttpBindings = {
  timeout: () => undefined,
  requestIP: () => ({ address: "127.0.0.1" }),
};

export function cabecerasPrueba(extra?: RequestInit["headers"]): Headers {
  const cabeceras = new Headers({ "Content-Type": TIPO_CONTENIDO.JSON });
  for (const [nombre, valor] of new Headers(extra)) cabeceras.set(nombre, valor);
  return cabeceras;
}

export const MARCA_COMENTARIO = ":";

export function eventosSse(
  cuerpo: ReadableStream<Uint8Array>,
  alComentar: (comentario: string) => void = () => undefined,
): ReadableStream<EventSourceMessage> {
  return cuerpo
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream({ onComment: (comentario) => alComentar(comentario.trim()) }));
}

export async function leerSse(respuesta: Response): Promise<LecturaSse> {
  const eventos: FrameSse[] = [];
  const comentarios: string[] = [];
  const secuencia: string[] = [];
  if (respuesta.body === null) return { eventos, comentarios, secuencia };
  const alComentar = (comentario: string) => {
    comentarios.push(comentario);
    secuencia.push(`${MARCA_COMENTARIO}${comentario}`);
  };
  for await (const mensaje of eventosSse(respuesta.body, alComentar)) {
    const frame = { event: mensaje.event ?? "", data: mensaje.data };
    eventos.push(frame);
    secuencia.push(frame.event);
  }
  return { eventos, comentarios, secuencia };
}

export function eventoDeFrame(frame: FrameSse): EventoAgente {
  return JSON.parse(frame.data);
}

export function inicioDeFrames(frames: readonly FrameSse[]): EventoInicioTurno {
  const inicio = frames[0] === undefined ? undefined : eventoDeFrame(frames[0]);
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error(`falta ${TIPO_EVENTO.INICIO_TURNO}`);
  return inicio;
}

export function crearServidorPrueba(opciones: OpcionesServidorPrueba): ServidorPrueba {
  const creacion = createServer({
    rootDirectory: opciones.raiz,
    fetch: opciones.fetch,
    envSource: { LLM_API_KEY: CLAVE_PRUEBA, LOG_LEVEL: NIVELES_LOG.SILENCIO, ...opciones.entorno },
    wait: async () => undefined,
    ...(opciones.latidoMs === undefined ? {} : { heartbeatMs: opciones.latidoMs }),
  });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  const { app, port } = creacion;
  return {
    app,
    port,
    pedir: async (ruta, init = {}) =>
      app.request(ruta, { ...init, headers: cabecerasPrueba(init.headers) }, BINDINGS_PRUEBA),
    leerSse,
  };
}
