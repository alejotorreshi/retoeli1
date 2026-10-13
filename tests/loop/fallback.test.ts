import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA, crearAgenteFetch, MARCA_CLAVE } from "@tests/helpers/agente-fetch.helper.ts";
import { errores, finDeTurno, textoFinal, usos } from "@tests/helpers/eventos.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { PedidoRegistrado, RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  PRESET_DEEPSEEK,
  PROVEEDOR_DEEPSEEK,
  REINTENTOS_LLM_POR_DEFECTO,
} from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";

const CASO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const INTENTOS = 1 + REINTENTOS_LLM_POR_DEFECTO;
const NO_DISPONIBLE: RespuestaGuion = {
  estado: 503,
  cuerpo: { error: { message: "servicio no disponible" } },
};
const OTRO_HOST = "https://otro.example/v1";
const CLAVE_RESPALDO = "clave-del-respaldo-Wm4K";
const DESDE_RESPALDO = "Respondo desde el modelo de respaldo.";

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;

beforeAll(() => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
});

beforeEach(async () => {
  proyecto = await crearProyectoTemporal();
});

afterEach(async () => {
  await proyecto.limpiar();
});

function veces(respuesta: RespuestaGuion, cantidad: number): RespuestaGuion[] {
  return Array.from({ length: cantidad }, () => respuesta);
}

function pedido(pedidos: readonly PedidoRegistrado[], indice: number): PedidoRegistrado {
  const registrado = pedidos[indice];
  if (registrado === undefined) throw new Error(`falta el pedido ${indice}`);
  return registrado;
}

function textoDelRespaldo(): RespuestaGuion {
  return { cuerpo: { ...(cuerpoConTexto(DESDE_RESPALDO) as object), model: PRESET_DEEPSEEK.fallbackModel } };
}

describe("el modelo de respaldo compuesto en crearAgente (LLM-04, D-51, D-52)", () => {
  test("tres 503 del primario pasan a deepseek-v4-pro con la misma URL y la misma clave, y su uso cuenta en la sesión", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO }, id: "leer-1" }) },
      ...veces(NO_DISPONIBLE, INTENTOS),
      textoDelRespaldo(),
    ]);
    const prueba = crearAgenteFetch({ raiz: proyecto.raiz, fetch });

    const turno = await prueba.turno(`procesa el caso ${CASO}`);
    expect(pedidos).toHaveLength(2 + INTENTOS);
    const primero = pedido(pedidos, 0);
    const respaldo = pedido(pedidos, 1 + INTENTOS);
    expect(pedidos.slice(0, 1 + INTENTOS).map((registrado) => registrado.cuerpo.model)).toEqual(
      veces(NO_DISPONIBLE, 1 + INTENTOS).map(() => PRESET_DEEPSEEK.model),
    );
    expect(respaldo.cuerpo.model).toBe(PRESET_DEEPSEEK.fallbackModel);
    expect(respaldo.url).toBe(primero.url);
    expect(respaldo.cabeceras.authorization).toBe(`Bearer ${CLAVE_PRUEBA}`);
    expect(respaldo.cabeceras.authorization).toBe(primero.cabeceras.authorization ?? "");

    const [usoPrimario, usoRespaldo] = usos(turno);
    expect(usoRespaldo).toMatchObject({
      proveedor: PROVEEDOR_DEEPSEEK,
      modelo: PRESET_DEEPSEEK.fallbackModel,
    });
    expect(usoRespaldo?.totalSesion).toBe(
      (usoPrimario?.totalSesion ?? 0) + (usoRespaldo?.entrada ?? 0) + (usoRespaldo?.salida ?? 0),
    );
    expect(errores(turno)).toEqual([]);
    expect(finDeTurno(turno).motivo).toBe(MOTIVO_FIN.FINAL);
    expect(textoFinal(turno)).toBe(DESDE_RESPALDO);
  });

  test("un respaldo en otro host sin clave propia nunca recibe un pedido ni la clave del primario", async () => {
    const { fetch, pedidos } = crearFetchFalso(veces(NO_DISPONIBLE, INTENTOS));
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: { LLM_FALLBACK_BASE_URL: OTRO_HOST },
    });

    const turno = await prueba.turno("hola");
    expect(pedidos).toHaveLength(INTENTOS);
    expect(pedidos.filter((registrado) => registrado.url.includes("otro.example"))).toEqual([]);
    expect(errores(turno).map((error) => error.codigo)).toEqual([CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
  });

  test("con su propia clave el respaldo en otro host recibe esa clave y nunca la del primario", async () => {
    const { fetch, pedidos } = crearFetchFalso([...veces(NO_DISPONIBLE, INTENTOS), textoDelRespaldo()]);
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: { LLM_FALLBACK_BASE_URL: OTRO_HOST, LLM_FALLBACK_API_KEY: CLAVE_RESPALDO },
    });

    const turno = await prueba.turno("hola");
    const respaldo = pedido(pedidos, INTENTOS);
    expect(respaldo.url.startsWith(OTRO_HOST)).toBe(true);
    expect(respaldo.cabeceras.authorization).toBe(`Bearer ${CLAVE_RESPALDO}`);
    expect(JSON.stringify(respaldo)).not.toContain(MARCA_CLAVE);
    expect(textoFinal(turno)).toBe(DESDE_RESPALDO);
  });
});
