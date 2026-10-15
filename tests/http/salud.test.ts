import { afterEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { cabecerasPrueba, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import {
  CABECERA,
  PUERTO_API_POR_DEFECTO,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { ESTADO_HTTP, ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

const SALUD_ESPERADA: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.DISPONIBLE,
};

const SALDO_AGOTADO: RespuestaGuion = {
  estado: ESTADO_HTTP.PAGO_REQUERIDO,
  cuerpo: { error: { message: "Insufficient Balance" } },
};

const limpiezas: (() => unknown)[] = [];

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servidorDePrueba(
  entorno: Readonly<Record<string, string>> = {},
  guion: readonly RespuestaGuion[] = [],
) {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso(guion);
  const armar = () => crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno });
  return { armar, pedidos: falso.pedidos };
}

function cabecerasComoTexto(respuesta: Response): string {
  return JSON.stringify([...respuesta.headers.entries()]);
}

async function turnoJson(servidor: ServidorPrueba, mensaje: string): Promise<Response> {
  return servidor.pedir(RUTA_API.CHAT, {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: TIPO_CONTENIDO.JSON },
    body: JSON.stringify({ sessionId: null, message: mensaje }),
  });
}

async function salud(servidor: ServidorPrueba): Promise<unknown> {
  const respuesta = await servidor.pedir(RUTA_API.SALUD);
  expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
  return respuesta.json();
}

function saludCon(llm: HealthResponse["llm"]): HealthResponse {
  return { ...SALUD_ESPERADA, llm };
}

describe("GET /api/health", () => {
  test("responde ok, proveedor y modelo sin acceso, sin llamar al proveedor y sin la clave", async () => {
    const { armar, pedidos } = await servidorDePrueba();
    const respuesta = await armar().pedir(RUTA_API.SALUD);
    const texto = await respuesta.text();
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(JSON.parse(texto)).toEqual(SALUD_ESPERADA);
    expect(pedidos).toHaveLength(0);
    expect(texto).not.toContain(CLAVE_PRUEBA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
  });

  test("responde lo mismo sobre un socket real de Bun.serve", async () => {
    const { armar, pedidos } = await servidorDePrueba();
    const servidor = Bun.serve({ port: 0, fetch: armar().app.fetch });
    limpiezas.push(() => servidor.stop(true));
    const respuesta = await fetch(new URL(RUTA_API.SALUD, servidor.url), { headers: cabecerasPrueba() });
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.json()).toEqual(SALUD_ESPERADA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
    expect(pedidos).toHaveLength(0);
  });

  test("refleja el saldo agotado de la última llamada y vuelve a disponible tras una llamada exitosa", async () => {
    const { armar, pedidos } = await servidorDePrueba({}, [
      SALDO_AGOTADO,
      { cuerpo: cuerpoConTexto("De nuevo en línea.") },
    ]);
    const servidor = armar();
    expect(await salud(servidor)).toEqual(saludCon(ESTADO_LLM.DISPONIBLE));

    expect((await turnoJson(servidor, "hola")).status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(1);
    expect(await salud(servidor)).toEqual(saludCon(ESTADO_LLM.SALDO_AGOTADO));
    expect(pedidos).toHaveLength(1);

    expect((await turnoJson(servidor, "¿sigues?")).status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(2);
    expect(await salud(servidor)).toEqual(saludCon(ESTADO_LLM.DISPONIBLE));
    expect(pedidos).toHaveLength(2);
  });

  test("un PORT fuera de rango no arma el servidor y explica el motivo", async () => {
    const { armar } = await servidorDePrueba({ PORT: "70000" });
    expect(armar).toThrow("PORT");
  });

  test("sin PORT el servidor usa el puerto por defecto", async () => {
    const { armar } = await servidorDePrueba();
    expect(armar().port).toBe(PUERTO_API_POR_DEFECTO);
  });
});
