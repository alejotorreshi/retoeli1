import { afterAll, afterEach, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { crearServidorPrueba, eventoDeFrame } from "@tests/helpers/servidor-prueba.helper.ts";
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

const ZONA_TOPES = "America/Lima";
const TOPE_DIARIO_PEQUENO = { AGENT_DAILY_TOKEN_BUDGET: "300" };
const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const ANTES_DE_MEDIANOCHE_EN_LIMA = new Date("2026-10-15T04:59:00Z");
const DESPUES_DE_MEDIANOCHE_EN_LIMA = new Date("2026-10-15T05:01:00Z");
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

async function salud(servidor: ServidorPrueba): Promise<unknown> {
  const respuesta = await servidor.pedir(RUTA_API.SALUD);
  return respuesta.json();
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
