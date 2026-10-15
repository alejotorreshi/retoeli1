import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { bitacoraMuda, capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import {
  crearFetchFalso,
  cuerpoConHerramientas,
  cuerpoConTexto,
  esperarPedidos,
} from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  BINDINGS_PRUEBA,
  cabecerasPrueba,
  crearServidorPrueba,
  eventoDeFrame,
  eventosSse,
  inicioDeFrames,
  leerSse,
  MARCA_COMENTARIO,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { Hono } from "hono";
import type { BitacoraEstructurada, CamposBitacora } from "@/application/types/puertos-agente.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  CABECERA,
  COMENTARIO_LATIDO,
  EVENTO_HTTP,
  MAX_CLAVES_LIMITADOR,
  MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO,
  RESPUESTA_HTTP,
  RUTA_API,
  SESIONES_NUEVAS_POR_HORA_POR_DEFECTO,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { MS_POR_HORA, ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import { registerChatRoute } from "@/http/routes/chat.route.ts";
import { createRateLimiter } from "@/http/services/rate-limiter.service.ts";
import { createTurnSlots } from "@/http/services/turn-slots.service.ts";
import type { ChatJsonResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const IDLE_TIMEOUT_S = 1;
const DEMORA_SILENCIO_MS = 2_500;
const LATIDO_CORTO_MS = 200;
const DEMORA_LATIDO_MS = 1_000;
const PLAZO_ABORTO_MS = 500;
const DETALLE_INTERNO = "detalle-interno-del-servidor-7Hq";

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;
const limpiezas: (() => unknown)[] = [];

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

function cuerpoChat(sessionId: string | null, message: string): string {
  return JSON.stringify({ sessionId, message });
}

function pedidoChat(sessionId: string | null, message: string, acepta?: string): RequestInit {
  const headers = acepta === undefined ? {} : { [CABECERA.ACCEPT]: acepta };
  return { method: "POST", headers: cabecerasPrueba(headers), body: cuerpoChat(sessionId, message) };
}

function servidorCon(guion: readonly RespuestaGuion[], latidoMs?: number) {
  const falso = crearFetchFalso(guion);
  const servidor = crearServidorPrueba({
    raiz: proyecto.raiz,
    fetch: falso.fetch,
    ...(latidoMs === undefined ? {} : { latidoMs }),
  });
  return { servidor, pedidos: falso.pedidos };
}

function socketReal(servidor: ServidorPrueba): URL {
  const real = Bun.serve({ port: 0, idleTimeout: IDLE_TIMEOUT_S, fetch: servidor.app.fetch });
  limpiezas.push(() => real.stop(true));
  return new URL(RUTA_API.CHAT, real.url);
}

function eventosDe(frames: readonly { event: string; data: string }[]): EventoAgente[] {
  return frames.map(eventoDeFrame);
}

function guionDeLectura(texto: string): RespuestaGuion[] {
  return [
    { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO } }) },
    { cuerpo: cuerpoConTexto(texto) },
  ];
}

describe("POST /api/chat sobre un socket real", () => {
  test("con idleTimeout de 1 s y 2,5 s de silencio del proveedor el SSE igual termina con turn_end", async () => {
    const { servidor } = servidorCon([
      { cuerpo: cuerpoConTexto("Listo."), demora: () => Bun.sleep(DEMORA_SILENCIO_MS) },
    ]);
    const url = socketReal(servidor);
    const { eventos } = await leerSse(await fetch(url, pedidoChat(null, "hola")));
    expect(eventos.at(-1)?.event).toBe(TIPO_EVENTO.FIN_TURNO);
    expect(eventos.map((frame) => frame.event)).toContain(TIPO_EVENTO.TEXTO);
  });

  test("con idleTimeout de 1 s y 2,5 s de silencio el respaldo JSON también completa", async () => {
    const { servidor } = servidorCon([
      { cuerpo: cuerpoConTexto("Listo."), demora: () => Bun.sleep(DEMORA_SILENCIO_MS) },
    ]);
    const url = socketReal(servidor);
    const respuesta = await fetch(url, pedidoChat(null, "hola", TIPO_CONTENIDO.JSON));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const cuerpo: ChatJsonResponse = JSON.parse(await respuesta.text());
    expect(cuerpo.reply).toBe("Listo.");
  });

  test("cerrar la conexión del cliente aborta el pedido colgado al proveedor y el servidor sigue atendiendo", async () => {
    const falso = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO } }) },
      { cuerpo: null, colgar: true },
      { cuerpo: cuerpoConTexto("De vuelta.") },
    ]);
    const senales: AbortSignal[] = [];
    const espia: FetchLike = (url, init) => {
      if (init.signal) senales.push(init.signal);
      return falso.fetch(url, init);
    };
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: espia });
    const url = socketReal(servidor);
    const corte = new AbortController();
    const respuesta = await fetch(url, {
      ...pedidoChat(null, `procesa el caso ${CASO}`),
      signal: corte.signal,
    });
    const cuerpo = respuesta.body;
    if (cuerpo === null) throw new Error("respuesta sin cuerpo");
    const vistos: EventoAgente[] = [];
    const lectura = (async () => {
      for await (const mensaje of eventosSse(cuerpo)) {
        vistos.push(eventoDeFrame({ event: mensaje.event ?? "", data: mensaje.data }));
      }
    })().catch(() => undefined);
    await esperarPedidos(falso.pedidos, 2);
    expect(vistos.map((evento) => evento.tipo)).toContain(TIPO_EVENTO.INICIO_HERRAMIENTA);
    corte.abort();
    await lectura;
    const colgada = senales[1];
    if (colgada === undefined) throw new Error("no llegó el pedido colgado");
    for (let espera = 0; espera < PLAZO_ABORTO_MS && !colgada.aborted; espera += 10) await Bun.sleep(10);
    expect(colgada.aborted).toBe(true);

    const inicio = vistos[0];
    if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error(`falta ${TIPO_EVENTO.INICIO_TURNO}`);
    const { sesionId } = inicio;
    const siguiente = await leerSse(await fetch(url, pedidoChat(sesionId, "¿seguimos?")));
    expect(siguiente.eventos.at(-1)?.event).toBe(TIPO_EVENTO.FIN_TURNO);
    expect(inicioDeFrames(siguiente.eventos).sesionId).toBe(sesionId);
  });
});

describe("POST /api/chat: latido, codificación e invariante SSE/JSON", () => {
  test("escribe un comentario de latido mientras el turno espera al proveedor", async () => {
    const { servidor } = servidorCon(
      [{ cuerpo: cuerpoConTexto("Listo."), demora: () => Bun.sleep(DEMORA_LATIDO_MS) }],
      LATIDO_CORTO_MS,
    );
    const { secuencia, comentarios } = await servidor.leerSse(
      await servidor.pedir(RUTA_API.CHAT, pedidoChat(null, "hola")),
    );
    expect(comentarios).toContain(COMENTARIO_LATIDO);
    const latido = secuencia.indexOf(`${MARCA_COMENTARIO}${COMENTARIO_LATIDO}`);
    expect(latido).toBeGreaterThanOrEqual(0);
    expect(latido).toBeLessThan(secuencia.indexOf(TIPO_EVENTO.FIN_TURNO));
  });

  test("ñ, tildes, ¿ y un salto de línea llegan intactos tras JSON.parse de la línea data:", async () => {
    const texto = "Señal ñ, ¿qué falta?\nlínea 2";
    const { servidor } = servidorCon([{ cuerpo: cuerpoConTexto(texto) }]);
    const { eventos } = await servidor.leerSse(await servidor.pedir(RUTA_API.CHAT, pedidoChat(null, "hola")));
    const recibido = eventosDe(eventos).find((evento) => evento.tipo === TIPO_EVENTO.TEXTO);
    expect(recibido?.tipo === TIPO_EVENTO.TEXTO && recibido.texto).toBe(texto);
  });

  test("un mismo turno da igual reply, toolCalls y needsConfirmation por SSE y por JSON", async () => {
    const sse = servidorCon(guionDeLectura("Leí la solicitud."));
    const frames = await sse.servidor.leerSse(
      await sse.servidor.pedir(RUTA_API.CHAT, pedidoChat(null, `procesa el caso ${CASO}`)),
    );
    const plegado = respuestaDeTurno(eventosDe(frames.eventos));

    const json = servidorCon([...guionDeLectura("Leí la solicitud."), { cuerpo: cuerpoConTexto("Sigo.") }]);
    const respuesta = await json.servidor.pedir(
      RUTA_API.CHAT,
      pedidoChat(null, `procesa el caso ${CASO}`, TIPO_CONTENIDO.JSON),
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get("Content-Type")).toStartWith(TIPO_CONTENIDO.JSON);
    const cuerpo: ChatJsonResponse = JSON.parse(await respuesta.text());
    expect(cuerpo.reply).toBe(plegado.reply);
    expect(cuerpo.toolCalls).toEqual(plegado.toolCalls);
    expect(cuerpo.needsConfirmation).toBe(plegado.needsConfirmation);
    expect(cuerpo.toolCalls).toHaveLength(1);

    if (cuerpo.sessionId === null) throw new Error("el JSON no trae sessionId");
    const seguimiento = await json.servidor.leerSse(
      await json.servidor.pedir(RUTA_API.CHAT, pedidoChat(cuerpo.sessionId, "¿y ahora?")),
    );
    const inicio = inicioDeFrames(seguimiento.eventos);
    expect(inicio.sesionId).toBe(cuerpo.sessionId);
    expect(inicio.sesionNueva).toBe(false);
  });
});

describe("POST /api/chat: cuerpos inválidos y errores contenidos", () => {
  const cuerposInvalidos: readonly (readonly [string, string])[] = [
    ["un cuerpo que no es JSON", "esto no es json"],
    ["un mensaje de solo espacios", cuerpoChat(null, "   ")],
    ["un campo extra", JSON.stringify({ sessionId: null, message: "hola", extra: 1 })],
  ];

  for (const [nombre, cuerpo] of cuerposInvalidos) {
    test(`${nombre} responde 400 con mensaje en español y sin llamar al proveedor`, async () => {
      const { servidor, pedidos } = servidorCon([]);
      const respuesta = await servidor.pedir(RUTA_API.CHAT, { method: "POST", body: cuerpo });
      expect(respuesta.status).toBe(RESPUESTA_HTTP.PEDIDO_INVALIDO);
      expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.cuerpoInvalido });
      expect(pedidos).toHaveLength(0);
    });
  }

  test("una excepción dentro del stream llega como error del contrato y cierra el turno", async () => {
    const registrados: CamposBitacora[] = [];
    const logger: BitacoraEstructurada = {
      ...bitacoraMuda(),
      error: (_evento, campos) => {
        if (campos !== undefined) registrados.push(campos);
      },
    };
    const agente: Agente = {
      proveedor: "falso",
      modelo: "falso",
      estadoLlm: () => ESTADO_LLM.DISPONIBLE,
      existeSesion: () => false,
      consultarSesion: () => null,
      async *turno() {
        yield {
          tipo: TIPO_EVENTO.INICIO_TURNO,
          sesionId: "s1",
          turnoId: "t1",
          sesionNueva: true,
          sesionExpirada: false,
        };
        throw new Error(DETALLE_INTERNO);
      },
    };
    const app = new Hono<HttpEnv>();
    app.onError(() => new Response(null, { status: RESPUESTA_HTTP.ERROR_INTERNO }));
    const cupos = createTurnSlots(1);
    registerChatRoute(app, {
      agente,
      secrets: [],
      logger,
      heartbeatMs: LATIDO_CORTO_MS,
      maxMessageChars: MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO,
      turnSlots: cupos,
      newSessions: createRateLimiter({
        limit: SESIONES_NUEVAS_POR_HORA_POR_DEFECTO,
        windowMs: MS_POR_HORA,
        maxKeys: MAX_CLAVES_LIMITADOR,
        now: Date.now,
      }),
      businessZone: () => ZONA_HORARIA_POR_DEFECTO,
    });
    const respuesta = await app.request(RUTA_API.CHAT, pedidoChat(null, "hola"), BINDINGS_PRUEBA);
    const crudo = await respuesta.clone().text();
    const { eventos } = await leerSse(respuesta);
    expect(eventos.map((frame) => frame.event)).toEqual([
      TIPO_EVENTO.INICIO_TURNO,
      TIPO_EVENTO.ERROR,
      TIPO_EVENTO.FIN_TURNO,
    ]);
    expect(JSON.parse(eventos[1]?.data ?? "null")).toEqual({
      tipo: TIPO_EVENTO.ERROR,
      turnoId: "t1",
      codigo: CODIGO_AGENTE.TURNO_INTERRUMPIDO,
      mensaje: MENSAJE_HTTP.errorInterno,
    });
    expect(JSON.parse(eventos[2]?.data ?? "null")).toEqual({
      tipo: TIPO_EVENTO.FIN_TURNO,
      turnoId: "t1",
      motivo: MOTIVO_FIN.ERROR,
      needsConfirmation: false,
    });
    expect(crudo).not.toContain(DETALLE_INTERNO);
    expect(registrados).toHaveLength(1);
    expect(cupos.inUse()).toBe(0);

    const porJson = await app.request(
      RUTA_API.CHAT,
      pedidoChat(null, "hola", TIPO_CONTENIDO.JSON),
      BINDINGS_PRUEBA,
    );
    expect(porJson.status).toBe(RESPUESTA_HTTP.ERROR_INTERNO);
    expect(cupos.inUse()).toBe(0);
  });

  test("una ruta /api desconocida responde 404 con mensaje en español", async () => {
    const { servidor } = servidorCon([]);
    const respuesta = await servidor.pedir(`${RUTA_API.CHAT}/no-existe`);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_ENCONTRADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.rutaNoEncontrada });
  });

  test("una excepción en cualquier ruta responde 500 con mensaje genérico y sin la pila", async () => {
    const logs = capturarLogs();
    const servidor = crearServidorPrueba({
      raiz: proyecto.raiz,
      fetch: crearFetchFalso([]).fetch,
      entorno: { LOG_LEVEL: NIVELES_LOG.ERROR },
      destinoLogs: logs.destino,
    });
    servidor.app.get(`${RUTA_API.SALUD}/explota`, () => {
      throw new Error(DETALLE_INTERNO);
    });
    const respuesta = await servidor.pedir(`${RUTA_API.SALUD}/explota`);
    const texto = await respuesta.text();
    expect(respuesta.status).toBe(RESPUESTA_HTTP.ERROR_INTERNO);
    expect(JSON.parse(texto)).toEqual({ mensaje: MENSAJE_HTTP.errorInterno });
    expect(texto).not.toContain(DETALLE_INTERNO);
    expect(logs.lineas().map((linea) => linea.msg)).toContain(EVENTO_HTTP.ERROR_NO_CONTROLADO);
    expect(logs.crudas.join("")).not.toContain(CLAVE_PRUEBA);
  });
});
