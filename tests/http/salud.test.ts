import { afterEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  BINDINGS_PRUEBA,
  cabecerasPrueba,
  crearServidorPrueba,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import {
  CABECERA,
  PUERTO_API_POR_DEFECTO,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { ESTADO_HTTP, ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

const SALUD_ESPERADA: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.DISPONIBLE,
};

const SIN_CLAVE = { LLM_API_KEY: "" };

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

async function turno(servidor: ServidorPrueba, mensaje: string, acepta: string): Promise<Response> {
  return servidor.pedir(RUTA_API.CHAT, {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: acepta },
    body: JSON.stringify({ sessionId: null, message: mensaje }),
  });
}

async function turnoJson(servidor: ServidorPrueba, mensaje: string): Promise<Response> {
  return turno(servidor, mensaje, TIPO_CONTENIDO.JSON);
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

describe("servidor sin clave del modelo", () => {
  test("arranca y health reporta sin_clave con el proveedor y el modelo configurados", async () => {
    const { armar, pedidos } = await servidorDePrueba(SIN_CLAVE);
    const servidor = armar();
    expect(await salud(servidor)).toEqual(saludCon(ESTADO_LLM.SIN_CLAVE));
    expect(pedidos).toHaveLength(0);
  });

  test.each([TIPO_CONTENIDO.JSON, TIPO_CONTENIDO.SSE])(
    "el chat con acceso responde 503 con el mensaje de clave faltante (Accept %p)",
    async (acepta) => {
      const { armar, pedidos } = await servidorDePrueba(SIN_CLAVE);
      const respuesta = await turno(armar(), "procesa el caso co-industrias-delta", acepta);
      expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_DISPONIBLE);
      expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE] });
      expect(pedidos).toHaveLength(0);
    },
  );

  test("el chat sin acceso sigue respondiendo 401 antes de hablar de la clave", async () => {
    const { armar } = await servidorDePrueba(SIN_CLAVE);
    const respuesta = await armar().app.request(
      RUTA_API.CHAT,
      {
        method: "POST",
        headers: { "Content-Type": TIPO_CONTENIDO.JSON },
        body: JSON.stringify({ sessionId: null, message: "hola" }),
      },
      BINDINGS_PRUEBA,
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
  });

  test("un cuerpo inválido sigue respondiendo 400 antes de hablar de la clave", async () => {
    const { armar } = await servidorDePrueba(SIN_CLAVE);
    const respuesta = await armar().pedir(RUTA_API.CHAT, { method: "POST", body: JSON.stringify({}) });
    expect(respuesta.status).toBe(RESPUESTA_HTTP.PEDIDO_INVALIDO);
  });

  test("una configuración inválida del modelo sigue impidiendo el arranque con su mensaje en español", async () => {
    const { armar } = await servidorDePrueba({ LLM_TIMEOUT_MS: "nunca" });
    expect(armar).toThrow(MENSAJE_AGENTE[CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA]);
  });
});
