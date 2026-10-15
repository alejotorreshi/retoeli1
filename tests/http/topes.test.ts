import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { CABECERA, RESPUESTA_HTTP, RUTA_API, TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

const ZONA_TOPES = "America/Lima";
const TOPE_DIARIO_PEQUENO = { AGENT_DAILY_TOKEN_BUDGET: "300" };

const limpiezas: (() => unknown)[] = [];
let zonaPrevia: string | undefined;

beforeAll(() => {
  zonaPrevia = process.env.TZ_NEGOCIO;
  process.env.TZ_NEGOCIO = ZONA_TOPES;
});

afterAll(() => {
  if (zonaPrevia === undefined) delete process.env.TZ_NEGOCIO;
  else process.env.TZ_NEGOCIO = zonaPrevia;
});

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servidorCon(entorno: Readonly<Record<string, string>>, guion: readonly RespuestaGuion[]) {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso(guion);
  const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno });
  return { servidor, pedidos: falso.pedidos };
}

async function turno(servidor: ServidorPrueba, mensaje: string, acepta: string): Promise<Response> {
  return servidor.pedir(RUTA_API.CHAT, {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: acepta },
    body: JSON.stringify({ sessionId: null, message: mensaje }),
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
});
