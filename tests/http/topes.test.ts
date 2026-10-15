import { afterAll, afterEach, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import {
  crearFetchFalso,
  cuerpoConHerramientas,
  cuerpoConTexto,
  diferido,
  esperarPedidos,
} from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { crearServidorPrueba, eventoDeFrame, eventosSse } from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CABECERA, RESPUESTA_HTTP, RUTA_API, TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM, PRESET_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE, MENSAJE_HTTP } from "@/config/strings.ts";
import type { ChatJsonResponse, HealthResponse } from "@/http/types/api.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

const ZONA_TOPES = "America/Lima";
const TOPE_DIARIO_PEQUENO = { AGENT_DAILY_TOKEN_BUDGET: "300" };
const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const ANTES_DE_MEDIANOCHE_EN_LIMA = new Date("2026-10-15T04:59:00Z");
const DESPUES_DE_MEDIANOCHE_EN_LIMA = new Date("2026-10-15T05:01:00Z");
const IP_CLIENTE = "192.0.2.10";
const IP_OTRO_CLIENTE = "192.0.2.20";
const MENSAJES_POR_MINUTO = 10;
const UN_MINUTO_MS = 60_000;
const AHORA = 1_790_000_000_000;
const CUERPO_INVALIDO = JSON.stringify({});
const TURNOS_SIMULTANEOS = 3;
const SIN_TOPE_DE_MENSAJES = { RATE_LIMIT_CHAT_PER_MINUTE: "1000" };
const UN_SOLO_CUPO = { ...SIN_TOPE_DE_MENSAJES, MAX_CONCURRENT_TURNS: "1" };
const SIN_RESPALDO = { LLM_FALLBACK_ENABLED: "false", LLM_MAX_RETRIES: "0" };
const ESPERAS_DE_CUPO = 200;
const PAUSA_CUPO_MS = 5;
const SESIONES_POR_HORA = 5;
const UNA_HORA_MS = 3_600_000;
const SESION_INVENTADA = "sesion-inventada-1";
const OTRA_SESION_INVENTADA = "sesion-inventada-2";
const UNA_SESION_NUEVA = { NEW_SESSIONS_PER_HOUR: "1" };
const COLGADO: RespuestaGuion = { cuerpo: null, colgar: true };
const NO_DISPONIBLE: RespuestaGuion = {
  estado: RESPUESTA_HTTP.NO_DISPONIBLE,
  cuerpo: { error: { message: "servicio no disponible" } },
};

const limpiezas: (() => unknown)[] = [];
let zonaPrevia: string | undefined;
let restaurarFecha: () => void;

beforeAll(() => {
  zonaPrevia = process.env.TZ_NEGOCIO;
  process.env.TZ_NEGOCIO = ZONA_TOPES;
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
  if (zonaPrevia === undefined) delete process.env.TZ_NEGOCIO;
  else process.env.TZ_NEGOCIO = zonaPrevia;
});

afterEach(async () => {
  setSystemTime();
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servidorCon(entorno: Readonly<Record<string, string>>, guion: readonly RespuestaGuion[]) {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso(guion);
  const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno });
  return { servidor, pedidos: falso.pedidos };
}

async function turno(
  servidor: ServidorPrueba,
  mensaje: string,
  acepta: string,
  sessionId: string | null = null,
): Promise<Response> {
  return servidor.pedir(RUTA_API.CHAT, {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: acepta },
    body: JSON.stringify({ sessionId, message: mensaje }),
  });
}

function textos(cantidad: number): RespuestaGuion[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    cuerpo: cuerpoConTexto(`Respuesta ${indice}.`),
  }));
}

function pedidoDeTurno(mensaje: string, acepta: string = TIPO_CONTENIDO.JSON): RequestInit {
  return {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: acepta },
    body: JSON.stringify({ sessionId: null, message: mensaje }),
  };
}

async function esRechazoDeSesiones(respuesta: Response): Promise<void> {
  expect(respuesta.status).toBe(RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
  expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.demasiadasSesiones });
}

async function sesionDe(respuesta: Response): Promise<string> {
  expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
  const cuerpo: ChatJsonResponse = JSON.parse(await respuesta.text());
  if (cuerpo.sessionId === null) throw new Error("la respuesta no trae sessionId");
  return cuerpo.sessionId;
}

async function salud(servidor: ServidorPrueba): Promise<unknown> {
  const respuesta = await servidor.pedir(RUTA_API.SALUD);
  return respuesta.json();
}

function pedidoInvalido(): RequestInit {
  return { method: "POST", body: CUERPO_INVALIDO };
}

function cortarAlFinal(respuesta: Response): Response {
  limpiezas.push(() => respuesta.body?.cancel().catch(() => undefined));
  return respuesta;
}

async function hastaQueHayaCupo(intentar: () => Promise<Response>): Promise<Response> {
  for (let espera = 0; espera < ESPERAS_DE_CUPO; espera += 1) {
    const respuesta = await intentar();
    if (respuesta.status !== RESPUESTA_HTTP.NO_DISPONIBLE) return respuesta;
    await Bun.sleep(PAUSA_CUPO_MS);
  }
  throw new Error("el cupo no se liberó");
}

async function primerEvento(lector: ReturnType<typeof lectorDe>) {
  const { value } = await lector.read();
  if (value === undefined) throw new Error("el stream terminó sin eventos");
  return eventoDeFrame({ event: value.event ?? "", data: value.data });
}

async function restoDeEventos(lector: ReturnType<typeof lectorDe>): Promise<EventoAgente[]> {
  const eventos: EventoAgente[] = [];
  for (let leido = await lector.read(); !leido.done; leido = await lector.read()) {
    eventos.push(eventoDeFrame({ event: leido.value.event ?? "", data: leido.value.data }));
  }
  return eventos;
}

function lectorDe(respuesta: Response) {
  if (respuesta.body === null) throw new Error("respuesta sin cuerpo");
  return eventosSse(respuesta.body).getReader();
}

function conEstado(llm: HealthResponse["llm"]): Partial<HealthResponse> {
  return { llm };
}

describe("tope diario", () => {
  test("después de un turno que agota el tope, el siguiente mensaje recibe 429 con la zona y health reporta tope_diario", async () => {
    const { servidor, pedidos } = await servidorCon(TOPE_DIARIO_PEQUENO, [
      { cuerpo: cuerpoConTexto("Listo, revisé el caso.") },
    ]);
    expect((await turno(servidor, "procesa el caso", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(1);
    expect(await salud(servidor)).toMatchObject(conEstado(ESTADO_LLM.TOPE_DIARIO));

    for (const acepta of [TIPO_CONTENIDO.JSON, TIPO_CONTENIDO.SSE]) {
      const rechazo = await turno(servidor, "¿sigues?", acepta);
      expect(rechazo.status).toBe(RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
      expect(await rechazo.json()).toEqual({ mensaje: MENSAJE_HTTP.topeDiario(ZONA_TOPES) });
    }
    expect(pedidos).toHaveLength(1);
  });

  test("con el tope por defecto un turno normal no lo agota", async () => {
    const { servidor, pedidos } = await servidorCon({}, [{ cuerpo: cuerpoConTexto("Listo.") }]);
    expect((await turno(servidor, "hola", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.OK);
    expect(await salud(servidor)).toMatchObject(conEstado(ESTADO_LLM.DISPONIBLE));
    expect(pedidos).toHaveLength(1);
  });

  test("los tokens del modelo de respaldo también cuentan para el tope", async () => {
    const { servidor, pedidos } = await servidorCon({ ...TOPE_DIARIO_PEQUENO, LLM_MAX_RETRIES: "0" }, [
      NO_DISPONIBLE,
      { cuerpo: cuerpoConTexto("Respondo desde el respaldo.") },
    ]);
    expect((await turno(servidor, "hola", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos.map((pedido) => pedido.cuerpo.model)).toEqual([
      PRESET_DEEPSEEK.model,
      PRESET_DEEPSEEK.fallbackModel,
    ]);
    expect(await salud(servidor)).toMatchObject(conEstado(ESTADO_LLM.TOPE_DIARIO));
  });

  test("un turno que cruza el tope entre dos llamadas termina con el error del catálogo y turn_end, y la sesión sigue usable tras la medianoche de negocio", async () => {
    setSystemTime(ANTES_DE_MEDIANOCHE_EN_LIMA);
    const { servidor, pedidos } = await servidorCon(TOPE_DIARIO_PEQUENO, [
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO } }) },
      { cuerpo: cuerpoConTexto("Seguimos con el caso.") },
    ]);
    const cruce = await turno(servidor, `lee ${CASO}`, TIPO_CONTENIDO.SSE);
    expect(cruce.status).toBe(RESPUESTA_HTTP.OK);
    const eventos = (await servidor.leerSse(cruce)).eventos.map(eventoDeFrame);
    expect(eventos.map((evento) => evento.tipo)).toContain(TIPO_EVENTO.FIN_HERRAMIENTA);
    expect(eventos.filter((evento) => evento.tipo === TIPO_EVENTO.ERROR)).toEqual([
      expect.objectContaining({
        codigo: CODIGO_AGENTE.TOPE_DIARIO_ALCANZADO,
        mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.TOPE_DIARIO_ALCANZADO],
      }),
    ]);
    expect(eventos.at(-1)).toMatchObject({ tipo: TIPO_EVENTO.FIN_TURNO, motivo: MOTIVO_FIN.ERROR });
    expect(pedidos).toHaveLength(1);
    const inicio = eventos[0];
    if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
    expect((await turno(servidor, "¿sigues?", TIPO_CONTENIDO.JSON, inicio.sesionId)).status).toBe(
      RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
    );

    setSystemTime(DESPUES_DE_MEDIANOCHE_EN_LIMA);
    expect(await salud(servidor)).toMatchObject(conEstado(ESTADO_LLM.DISPONIBLE));
    const siguiente = await turno(servidor, "¿sigues?", TIPO_CONTENIDO.JSON, inicio.sesionId);
    expect(siguiente.status).toBe(RESPUESTA_HTTP.OK);
    const esperada: Partial<ChatJsonResponse> = {
      sessionId: inicio.sesionId,
      reply: "Seguimos con el caso.",
    };
    expect(await siguiente.json()).toMatchObject(esperada);
    expect(pedidos).toHaveLength(2);
  });
});

describe("mensajes por minuto", () => {
  test("diez POST /api/chat de un cliente pasan, el undécimo recibe 429, otro cliente sigue y al vencer el minuto vuelve a pasar", async () => {
    let ahora = AHORA;
    const proyecto = await crearProyectoTemporal();
    limpiezas.push(proyecto.limpiar);
    const falso = crearFetchFalso([]);
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, ahora: () => ahora });

    const estados: number[] = [];
    for (let envio = 0; envio < MENSAJES_POR_MINUTO; envio += 1) {
      estados.push((await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoInvalido())).status);
    }
    expect(estados).toEqual(Array(MENSAJES_POR_MINUTO).fill(RESPUESTA_HTTP.PEDIDO_INVALIDO));

    const undecimo = await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoInvalido());
    expect(undecimo.status).toBe(RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
    expect(await undecimo.json()).toEqual({ mensaje: MENSAJE_HTTP.demasiadosMensajes });

    const otro = await servidor.pedirDesde(IP_OTRO_CLIENTE, RUTA_API.CHAT, pedidoInvalido());
    expect(otro.status).toBe(RESPUESTA_HTTP.PEDIDO_INVALIDO);

    ahora = AHORA + UN_MINUTO_MS - 1;
    expect((await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoInvalido())).status).toBe(
      RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
    );
    ahora = AHORA + UN_MINUTO_MS;
    expect((await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoInvalido())).status).toBe(
      RESPUESTA_HTTP.PEDIDO_INVALIDO,
    );
    expect(falso.pedidos).toHaveLength(0);
  });

  test("RATE_LIMIT_CHAT_PER_MINUTE cambia el tope y los mensajes válidos también cuentan", async () => {
    const { servidor, pedidos } = await servidorCon({ RATE_LIMIT_CHAT_PER_MINUTE: "1" }, [
      { cuerpo: cuerpoConTexto("Listo.") },
    ]);
    expect((await turno(servidor, "hola", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.OK);
    const segundo = await turno(servidor, "¿sigues?", TIPO_CONTENIDO.JSON);
    expect(segundo.status).toBe(RESPUESTA_HTTP.DEMASIADOS_PEDIDOS);
    expect(await segundo.json()).toEqual({ mensaje: MENSAJE_HTTP.demasiadosMensajes });
    expect(pedidos).toHaveLength(1);
  });

  test("GET /api/config y /api/health no cuentan para el tope de mensajes", async () => {
    const { servidor } = await servidorCon({ RATE_LIMIT_CHAT_PER_MINUTE: "1" }, []);
    for (let pedido = 0; pedido < MENSAJES_POR_MINUTO; pedido += 1) {
      await servidor.pedir(RUTA_API.SALUD);
      await servidor.pedir(RUTA_API.CONFIG);
    }
    expect((await servidor.pedir(RUTA_API.CHAT, pedidoInvalido())).status).toBe(
      RESPUESTA_HTTP.PEDIDO_INVALIDO,
    );
  });
});

describe("turnos simultáneos", () => {
  test("tres turnos colgados ocupan los cupos, el cuarto recibe 503, health responde 200 sin pedir al proveedor y abortar uno libera su cupo", async () => {
    const { servidor, pedidos } = await servidorCon({}, [
      COLGADO,
      COLGADO,
      COLGADO,
      { cuerpo: cuerpoConTexto("Ya hay lugar.") },
    ]);
    const colgados: Response[] = [];
    for (let turnoColgado = 0; turnoColgado < TURNOS_SIMULTANEOS; turnoColgado += 1) {
      colgados.push(cortarAlFinal(await turno(servidor, "procesa el caso", TIPO_CONTENIDO.SSE)));
    }
    await esperarPedidos(pedidos, TURNOS_SIMULTANEOS);

    for (const acepta of [TIPO_CONTENIDO.JSON, TIPO_CONTENIDO.SSE]) {
      const cuarto = await turno(servidor, "hola", acepta);
      expect(cuarto.status).toBe(RESPUESTA_HTTP.NO_DISPONIBLE);
      expect(await cuarto.json()).toEqual({ mensaje: MENSAJE_HTTP.servidorOcupado });
    }

    const enCarga = await servidor.pedir(RUTA_API.SALUD);
    expect(enCarga.status).toBe(RESPUESTA_HTTP.OK);
    expect(await enCarga.json()).toMatchObject(conEstado(ESTADO_LLM.DISPONIBLE));
    expect(pedidos).toHaveLength(TURNOS_SIMULTANEOS);

    await colgados[0]?.body?.cancel();
    const liberado = await hastaQueHayaCupo(() => turno(servidor, "hola", TIPO_CONTENIDO.JSON));
    expect(liberado.status).toBe(RESPUESTA_HTTP.OK);
    const esperada: Partial<ChatJsonResponse> = { reply: "Ya hay lugar." };
    expect(await liberado.json()).toMatchObject(esperada);
    expect(pedidos).toHaveLength(TURNOS_SIMULTANEOS + 1);
  });

  test("un cupo se libera cuando el turno termina por SSE o JSON, cuando falla y cuando el cliente lo aborta", async () => {
    const { servidor, pedidos } = await servidorCon({ ...UN_SOLO_CUPO, ...SIN_RESPALDO }, [
      { cuerpo: cuerpoConTexto("Por SSE.") },
      { cuerpo: cuerpoConTexto("Por JSON.") },
      NO_DISPONIBLE,
      COLGADO,
      { cuerpo: cuerpoConTexto("Después del aborto.") },
    ]);
    const porSse = await servidor.leerSse(await turno(servidor, "uno", TIPO_CONTENIDO.SSE));
    expect(porSse.eventos.at(-1)?.event).toBe(TIPO_EVENTO.FIN_TURNO);

    const porJson = await turno(servidor, "dos", TIPO_CONTENIDO.JSON);
    expect(porJson.status).toBe(RESPUESTA_HTTP.OK);
    await porJson.json();

    const fallido = await servidor.leerSse(await turno(servidor, "tres", TIPO_CONTENIDO.SSE));
    expect(fallido.eventos.map(eventoDeFrame).at(-1)).toMatchObject({
      tipo: TIPO_EVENTO.FIN_TURNO,
      motivo: MOTIVO_FIN.ERROR,
    });

    const colgado = cortarAlFinal(await turno(servidor, "cuatro", TIPO_CONTENIDO.SSE));
    await esperarPedidos(pedidos, 4);
    expect((await turno(servidor, "cinco", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.NO_DISPONIBLE);

    await colgado.body?.cancel();
    const tras = await hastaQueHayaCupo(() => turno(servidor, "cinco", TIPO_CONTENIDO.JSON));
    const esperada: Partial<ChatJsonResponse> = { reply: "Después del aborto." };
    expect(await tras.json()).toMatchObject(esperada);
    expect(pedidos).toHaveLength(5);
  });

  test("MAX_CONCURRENT_TURNS cambia la cantidad de cupos", async () => {
    const { servidor, pedidos } = await servidorCon(UN_SOLO_CUPO, [COLGADO]);
    cortarAlFinal(await turno(servidor, "uno", TIPO_CONTENIDO.SSE));
    await esperarPedidos(pedidos, 1);
    const segundo = await turno(servidor, "dos", TIPO_CONTENIDO.JSON);
    expect(segundo.status).toBe(RESPUESTA_HTTP.NO_DISPONIBLE);
    expect(await segundo.json()).toEqual({ mensaje: MENSAJE_HTTP.servidorOcupado });
  });
});

describe("misma sesión", () => {
  test("un segundo mensaje en la sesión mientras su turno corre recibe SESION_OCUPADA y turn_end, y el primero termina normal", async () => {
    const espera = diferido();
    const { servidor, pedidos } = await servidorCon({}, [
      { cuerpo: cuerpoConTexto("Primero listo."), demora: espera.promesa },
    ]);
    const lector = lectorDe(await turno(servidor, "procesa el caso", TIPO_CONTENIDO.SSE));
    const inicio = await primerEvento(lector);
    if (inicio.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
    await esperarPedidos(pedidos, 1);

    const segundo = await servidor.leerSse(
      await turno(servidor, "¿y ahora?", TIPO_CONTENIDO.SSE, inicio.sesionId),
    );
    const eventos = segundo.eventos.map(eventoDeFrame);
    expect(eventos.map((evento) => evento.tipo)).toEqual([
      TIPO_EVENTO.INICIO_TURNO,
      TIPO_EVENTO.ERROR,
      TIPO_EVENTO.FIN_TURNO,
    ]);
    expect(eventos[1]).toMatchObject({
      codigo: CODIGO_AGENTE.SESION_OCUPADA,
      mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.SESION_OCUPADA],
    });
    expect(eventos[0]).toMatchObject({ sesionId: inicio.sesionId });
    expect(pedidos).toHaveLength(1);

    espera.soltar();
    const resto = await restoDeEventos(lector);
    expect(resto.find((evento) => evento.tipo === TIPO_EVENTO.TEXTO)).toMatchObject({
      texto: "Primero listo.",
    });
    expect(resto.at(-1)).toMatchObject({ tipo: TIPO_EVENTO.FIN_TURNO, motivo: MOTIVO_FIN.FINAL });
  });
});

describe("sesiones nuevas", () => {
  test("cinco sesiones nuevas de un cliente en una hora pasan, la sexta recibe 429, otro cliente sigue y al vencer la hora vuelve a pasar", async () => {
    let ahora = AHORA;
    const proyecto = await crearProyectoTemporal();
    limpiezas.push(proyecto.limpiar);
    const falso = crearFetchFalso(textos(SESIONES_POR_HORA + 2));
    const servidor = crearServidorPrueba({
      raiz: proyecto.raiz,
      fetch: falso.fetch,
      entorno: SIN_TOPE_DE_MENSAJES,
      ahora: () => ahora,
    });

    const sesiones = new Set<string>();
    for (let nueva = 0; nueva < SESIONES_POR_HORA; nueva += 1) {
      sesiones.add(
        await sesionDe(await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoDeTurno("hola"))),
      );
    }
    expect(sesiones.size).toBe(SESIONES_POR_HORA);

    for (const acepta of [TIPO_CONTENIDO.JSON, TIPO_CONTENIDO.SSE]) {
      const sexta = await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoDeTurno("otra", acepta));
      await esRechazoDeSesiones(sexta);
    }
    expect(falso.pedidos).toHaveLength(SESIONES_POR_HORA);

    await sesionDe(await servidor.pedirDesde(IP_OTRO_CLIENTE, RUTA_API.CHAT, pedidoDeTurno("hola")));

    ahora = AHORA + UNA_HORA_MS - 1;
    await esRechazoDeSesiones(await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoDeTurno("otra")));
    ahora = AHORA + UNA_HORA_MS;
    await sesionDe(await servidor.pedirDesde(IP_CLIENTE, RUTA_API.CHAT, pedidoDeTurno("otra")));
    expect(falso.pedidos).toHaveLength(SESIONES_POR_HORA + 2);
  });

  test("seguir en una sesión existente nunca cuenta como sesión nueva", async () => {
    const continuaciones = 4;
    const { servidor, pedidos } = await servidorCon(
      { ...SIN_TOPE_DE_MENSAJES, ...UNA_SESION_NUEVA },
      textos(continuaciones + 1),
    );
    const sesion = await sesionDe(await turno(servidor, "procesa el caso", TIPO_CONTENIDO.JSON));
    for (let seguida = 0; seguida < continuaciones; seguida += 1) {
      expect(await sesionDe(await turno(servidor, "¿y ahora?", TIPO_CONTENIDO.JSON, sesion))).toBe(sesion);
    }
    await esRechazoDeSesiones(await turno(servidor, "otro caso", TIPO_CONTENIDO.JSON));
    expect(pedidos).toHaveLength(continuaciones + 1);
  });

  test("un sessionId inventado cuenta como sesión nueva", async () => {
    const { servidor, pedidos } = await servidorCon(
      { ...SIN_TOPE_DE_MENSAJES, ...UNA_SESION_NUEVA },
      textos(2),
    );
    const asignada = await sesionDe(await turno(servidor, "hola", TIPO_CONTENIDO.JSON, SESION_INVENTADA));
    expect(asignada).not.toBe(SESION_INVENTADA);
    await esRechazoDeSesiones(await turno(servidor, "hola", TIPO_CONTENIDO.JSON, OTRA_SESION_INVENTADA));
    await esRechazoDeSesiones(await turno(servidor, "hola", TIPO_CONTENIDO.JSON, SESION_INVENTADA));
    expect(await sesionDe(await turno(servidor, "sigo", TIPO_CONTENIDO.JSON, asignada))).toBe(asignada);
    expect(pedidos).toHaveLength(2);
  });

  test("un pedido rechazado por falta de cupo no gasta una sesión nueva", async () => {
    const { servidor, pedidos } = await servidorCon({ ...UN_SOLO_CUPO, NEW_SESSIONS_PER_HOUR: "2" }, [
      COLGADO,
      { cuerpo: cuerpoConTexto("Ya hay lugar.") },
    ]);
    const colgado = cortarAlFinal(await turno(servidor, "uno", TIPO_CONTENIDO.SSE));
    await esperarPedidos(pedidos, 1);
    for (let ocupado = 0; ocupado < SESIONES_POR_HORA; ocupado += 1) {
      expect((await turno(servidor, "dos", TIPO_CONTENIDO.JSON)).status).toBe(RESPUESTA_HTTP.NO_DISPONIBLE);
    }
    await colgado.body?.cancel();
    await sesionDe(await hastaQueHayaCupo(() => turno(servidor, "dos", TIPO_CONTENIDO.JSON)));
    await esRechazoDeSesiones(await turno(servidor, "tres", TIPO_CONTENIDO.JSON));
    expect(pedidos).toHaveLength(2);
  });
});
