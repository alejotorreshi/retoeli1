import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
  finDeTurno,
  finesDeHerramienta,
  textoFinal,
} from "@tests/helpers/eventos.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { mapearProyectado } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  crearServidorPrueba,
  eventoDeFrame,
  inicioDeFrames,
  leerSse,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { DESENLACE_ENVIO, TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import {
  CABECERA,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_HTTP, TEXTO_ENVIO_NO_REGISTRADO } from "@/config/strings.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];

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

function cuerpoChat(sessionId: string | null, message: string, accion?: unknown): RequestInit {
  const cuerpo = accion === undefined ? { sessionId, message } : { sessionId, message, accion };
  return { method: "POST", body: JSON.stringify(cuerpo) };
}

async function lecturaDe(respuesta: Response): Promise<{ sesionId: string; eventos: EventoAgente[] }> {
  const { eventos } = await leerSse(respuesta);
  return { sesionId: inicioDeFrames(eventos).sesionId, eventos: eventos.map(eventoDeFrame) };
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
    for (const frame of eventos) expect(frame.event).toBe(eventoDeFrame(frame).tipo);
    const finHerramienta = eventos
      .map(eventoDeFrame)
      .find((evento) => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA);
    expect(finHerramienta?.tipo === TIPO_EVENTO.FIN_HERRAMIENTA && finHerramienta.ok).toBe(true);
    expect(JSON.stringify(eventos)).not.toContain(CLAVE_PRUEBA);

    const inicio = inicioDeFrames(eventos);
    expect(inicio.sesionNueva).toBe(true);
    const segunda = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(inicio.sesionId, "¿Sigues ahí?"));
    const continuacion = inicioDeFrames((await servidor.leerSse(segunda)).eventos);
    expect(continuacion.sesionId).toBe(inicio.sesionId);
    expect(continuacion.sesionNueva).toBe(false);
  });
});

describe("POST /api/chat con accion estructurada (D-68)", () => {
  async function armarPorChat(siguientes: readonly RespuestaGuion[]) {
    const ctx = { directory: proyecto.raiz, sessionId: "preparacion-accion" };
    const mapeo = await mapearProyectado(crearHerramientas(), ctx, CASO);
    const falso = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: MAPEAR, argumentos: { caso: CASO, campos: [] } }) },
      { cuerpo: cuerpoConHerramientas({ nombre: GENERAR, argumentos: { caso: CASO, mapeo } }) },
      { cuerpo: cuerpoConHerramientas({ nombre: ARMAR, argumentos: { caso: CASO } }) },
      { cuerpo: cuerpoConTexto(`Armé el paquete de ${CASO}.`) },
      ...siguientes,
    ]);
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch });
    const procesar = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(null, `procesa el caso ${CASO}`));
    const { sesionId, eventos } = await lecturaDe(procesar);
    expect(confirmaciones(eventos).map(({ caso }) => caso)).toEqual([CASO]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(true);
    return { servidor, sesionId };
  }

  test("confirmar un caso pendiente autoriza su simular_envio en ese turno", async () => {
    const { servidor, sesionId } = await armarPorChat([
      { cuerpo: cuerpoConHerramientas({ nombre: SIMULAR, argumentos: { caso: CASO } }) },
      { cuerpo: cuerpoConTexto("Envío simulado registrado.") },
    ]);
    const accion = { tipo: TIPO_ACCION.CONFIRMAR, caso: CASO };
    const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(sesionId, `Sí, envía ${CASO}`, accion));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const { eventos } = await lecturaDe(respuesta);
    expect(finesDeHerramienta(eventos, SIMULAR)).toEqual([expect.objectContaining({ ok: true })]);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toContain(CASO);
  });

  test("la accion viaja hasta la compuerta: cancelar decide aunque el texto visible confirme", async () => {
    const { servidor, sesionId } = await armarPorChat([{ cuerpo: cuerpoConTexto("No envío nada.") }]);
    const accion = { tipo: TIPO_ACCION.CANCELAR, caso: CASO };
    const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(sesionId, `Sí, envía ${CASO}`, accion));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const { eventos } = await lecturaDe(respuesta);
    expect(finesDeHerramienta(eventos, SIMULAR)).toEqual([]);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
  });

  const accionesInvalidas: readonly (readonly [string, unknown])[] = [
    ["un tipo desconocido", { tipo: "aprobar", caso: CASO }],
    ["un campo extra en accion", { tipo: TIPO_ACCION.CONFIRMAR, caso: CASO, extra: 1 }],
  ];

  for (const [nombre, accion] of accionesInvalidas) {
    test(`${nombre} responde 400 sin llamar al proveedor`, async () => {
      const falso = crearFetchFalso([]);
      const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch });
      const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(null, `Sí, envía ${CASO}`, accion));
      expect(respuesta.status).toBe(RESPUESTA_HTTP.PEDIDO_INVALIDO);
      expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.cuerpoInvalido });
      expect(falso.pedidos).toHaveLength(0);
    });
  }
});

describe("G-03-26: el aviso de un envío que no ocurrió llega por el respaldo JSON y por SSE", () => {
  const AFIRMACION = "Registré el envío simulado.";
  const AVISO_SIN_PAQUETE = TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_PAQUETE](CASO);
  const AVISO_SIN_CASO = TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_CASO]();
  let limpio: ProyectoTemporal;

  beforeEach(async () => {
    limpio = await crearProyectoTemporal();
  });

  afterEach(async () => {
    await limpio.limpiar();
  });

  function servidorConEnvio(argumentos: unknown) {
    const falso = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: SIMULAR, argumentos }) },
      { cuerpo: cuerpoConTexto(AFIRMACION) },
    ]);
    return crearServidorPrueba({ raiz: limpio.raiz, fetch: falso.fetch });
  }

  function chatJson(message: string): RequestInit {
    return { ...cuerpoChat(null, message), headers: { [CABECERA.ACCEPT]: TIPO_CONTENIDO.JSON } };
  }

  const escenarios: readonly (readonly [string, unknown, string])[] = [
    ["escenario A: un caso sin paquete armado", { caso: CASO, confirmado: true }, AVISO_SIN_PAQUETE],
    ["escenario D: un pedido sin caso legible", { confirmado: true }, AVISO_SIN_CASO],
  ];

  for (const [nombre, argumentos, aviso] of escenarios) {
    test(`${nombre} responde por JSON con el aviso como último párrafo y needsConfirmation false`, async () => {
      const servidor = servidorConEnvio(argumentos);
      const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(`Sí, envía ${CASO}`));
      expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
      expect(respuesta.headers.get("Content-Type")).toStartWith(TIPO_CONTENIDO.JSON);
      expect(await respuesta.json()).toEqual({
        sessionId: expect.any(String),
        reply: `${AFIRMACION}${SEPARADOR_PARRAFOS}${aviso}`,
        toolCalls: [
          expect.objectContaining({
            herramienta: SIMULAR,
            ok: false,
            codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA,
          }),
        ],
        needsConfirmation: false,
      });
      expect(await casosConEnvioSimulado(limpio.raiz)).toEqual([]);
    });
  }

  test("escenario A por SSE: el último evento text antes de turn_end termina con el aviso SIN_PAQUETE", async () => {
    const servidor = servidorConEnvio({ caso: CASO, confirmado: true });
    const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(null, `Sí, envía ${CASO}`));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const { eventos } = await lecturaDe(respuesta);
    const tipos = eventos.map(({ tipo }) => tipo);
    expect(tipos.at(-1)).toBe(TIPO_EVENTO.FIN_TURNO);
    expect(tipos.lastIndexOf(TIPO_EVENTO.TEXTO)).toBeLessThan(tipos.lastIndexOf(TIPO_EVENTO.FIN_TURNO));
    expect(textoFinal(eventos)).toEndWith(`${SEPARADOR_PARRAFOS}${AVISO_SIN_PAQUETE}`);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
    expect(await casosConEnvioSimulado(limpio.raiz)).toEqual([]);
  });
});
