import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { FrameSse } from "@tests/helpers/types/servidor-prueba.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  CABECERA,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

function cuerpoChat(sessionId: string | null, message: string): RequestInit {
  return { method: "POST", body: JSON.stringify({ sessionId, message }) };
}

function eventoDe(frame: FrameSse): EventoAgente {
  return JSON.parse(frame.data);
}

function inicioDe(frames: readonly FrameSse[]) {
  const inicio = frames[0] === undefined ? undefined : eventoDe(frames[0]);
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error(`falta ${TIPO_EVENTO.INICIO_TURNO}`);
  return inicio;
}

describe("POST /api/chat por SSE", () => {
  test("transmite los eventos del bucle en orden, redactados y con las cabeceras anti-buffering", async () => {
    const falso = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO } }) },
      { cuerpo: cuerpoConTexto("Leí la solicitud.") },
      { cuerpo: cuerpoConTexto("Sigo en la misma sesión.") },
    ]);
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch });

    const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(null, `procesa el caso ${CASO}`));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get("Content-Type")).toStartWith(TIPO_CONTENIDO.SSE);
    expect(respuesta.headers.get(CABECERA.CACHE_CONTROL)).toBe(VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION);
    expect(respuesta.headers.get(CABECERA.X_ACCEL_BUFFERING)).toBe(VALOR_CABECERA.SIN_BUFFER);

    const { eventos } = await servidor.leerSse(respuesta);
    expect(eventos.map((frame) => frame.event)).toEqual([
      TIPO_EVENTO.INICIO_TURNO,
      TIPO_EVENTO.USO,
      TIPO_EVENTO.INICIO_HERRAMIENTA,
      TIPO_EVENTO.FIN_HERRAMIENTA,
      TIPO_EVENTO.USO,
      TIPO_EVENTO.TEXTO,
      TIPO_EVENTO.FIN_TURNO,
    ]);
    for (const frame of eventos) expect(frame.event).toBe(eventoDe(frame).tipo);
    const finHerramienta = eventos
      .map(eventoDe)
      .find((evento) => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA);
    expect(finHerramienta?.tipo === TIPO_EVENTO.FIN_HERRAMIENTA && finHerramienta.ok).toBe(true);
    expect(JSON.stringify(eventos)).not.toContain(CLAVE_PRUEBA);

    const inicio = inicioDe(eventos);
    expect(inicio.sesionNueva).toBe(true);
    const segunda = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(inicio.sesionId, "¿Sigues ahí?"));
    const continuacion = inicioDe((await servidor.leerSse(segunda)).eventos);
    expect(continuacion.sesionId).toBe(inicio.sesionId);
    expect(continuacion.sesionNueva).toBe(false);
  });
});
