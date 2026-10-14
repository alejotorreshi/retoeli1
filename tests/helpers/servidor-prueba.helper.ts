import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import type {
  FrameSse,
  LecturaSse,
  OpcionesServidorPrueba,
  ServidorPrueba,
} from "@tests/helpers/types/servidor-prueba.type.ts";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import type { HttpBindings } from "@/http/types/server.type.ts";
import { createServer } from "@/http/wiring/server.wiring.ts";

export const BINDINGS_PRUEBA: HttpBindings = {
  timeout: () => undefined,
  requestIP: () => ({ address: "127.0.0.1" }),
};

export function cabecerasPrueba(extra?: RequestInit["headers"]): Headers {
  const cabeceras = new Headers({ "Content-Type": TIPO_CONTENIDO.JSON });
  for (const [nombre, valor] of new Headers(extra)) cabeceras.set(nombre, valor);
  return cabeceras;
}

export async function leerSse(respuesta: Response): Promise<LecturaSse> {
  const eventos: FrameSse[] = [];
  const comentarios: string[] = [];
  if (respuesta.body === null) return { eventos, comentarios };
  const mensajes = respuesta.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new EventSourceParserStream({ onComment: (comentario) => comentarios.push(comentario.trim()) }),
    );
  for await (const mensaje of mensajes) eventos.push({ event: mensaje.event ?? "", data: mensaje.data });
  return { eventos, comentarios };
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
