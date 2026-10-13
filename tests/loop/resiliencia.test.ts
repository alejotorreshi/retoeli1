import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA, crearAgenteFetch } from "@tests/helpers/agente-fetch.helper.ts";
import { errores, finDeTurno, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { historialWireIntegro } from "@tests/helpers/historial.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { PedidoRegistrado, RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { REINTENTOS_LLM_POR_DEFECTO } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";

const CASO = "co-industrias-delta";
const LEER = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.LEER_SOLICITUD}`;
const SIN_RESPALDO = { LLM_FALLBACK_ENABLED: "false" };
const INTENTOS = 1 + REINTENTOS_LLM_POR_DEFECTO;
const NO_DISPONIBLE: RespuestaGuion = {
  estado: 503,
  cuerpo: { error: { message: "servicio no disponible" } },
};
const SIN_SALDO: RespuestaGuion = { estado: 402, cuerpo: { error: { message: "Insufficient Balance" } } };
const COLGADO: RespuestaGuion = { cuerpo: null, colgar: true };
const SIGO = "Sigo aquí.";

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

function historialesSanos(pedidos: readonly PedidoRegistrado[]): void {
  for (const registrado of pedidos) expect(historialWireIntegro(registrado.cuerpo.messages)).toEqual([]);
}

describe("los fallos del proveedor nunca matan la sesión (CA5, LLM-03, AGT-05)", () => {
  test("un 503 que no cede agota los reintentos, muestra el catálogo y el siguiente turno repite un historial íntegro", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO }, id: "leer-1" }) },
      ...veces(NO_DISPONIBLE, INTENTOS),
      { cuerpo: cuerpoConTexto(SIGO) },
    ]);
    const prueba = crearAgenteFetch({ raiz: proyecto.raiz, fetch, entorno: SIN_RESPALDO });

    const turno1 = await prueba.turno(`procesa el caso ${CASO}`);
    expect(pedidos).toHaveLength(1 + INTENTOS);
    expect(prueba.esperas).toHaveLength(REINTENTOS_LLM_POR_DEFECTO);
    expect(pedido(pedidos, 1).texto).toBe(pedido(pedidos, INTENTOS).texto);
    expect(errores(turno1)).toEqual([
      expect.objectContaining({
        codigo: CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE,
        mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE],
      }),
    ]);
    expect(finDeTurno(turno1).motivo).toBe(MOTIVO_FIN.ERROR);

    const turno2 = await prueba.turno("¿sigues?");
    expect(finDeTurno(turno2).motivo).toBe(MOTIVO_FIN.FINAL);
    expect(textoFinal(turno2)).toBe(SIGO);
    const repetido = pedido(pedidos, 1 + INTENTOS).cuerpo.messages;
    expect(repetido.map((mensaje) => mensaje.role)).toEqual([
      "system",
      "system",
      "user",
      "assistant",
      "tool",
      "assistant",
      "user",
    ]);
    expect(repetido[4]?.tool_call_id).toBe("leer-1");
    expect(repetido[5]?.content).toBe(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
    historialesSanos(pedidos);
  });

  test("un 402 hace un solo pedido, sin reintento, y su mensaje empieza con 'Saldo agotado'", async () => {
    const { fetch, pedidos } = crearFetchFalso([SIN_SALDO, { cuerpo: cuerpoConTexto(SIGO) }]);
    const prueba = crearAgenteFetch({ raiz: proyecto.raiz, fetch, entorno: SIN_RESPALDO });

    const turno1 = await prueba.turno("hola");
    expect(pedidos).toHaveLength(1);
    expect(prueba.esperas).toEqual([]);
    const [error] = errores(turno1);
    expect(error?.codigo).toBe(CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO);
    expect(error?.mensaje.toLowerCase().startsWith("saldo agotado")).toBe(true);
    expect(finDeTurno(turno1).motivo).toBe(MOTIVO_FIN.ERROR);

    const turno2 = await prueba.turno("¿sigues?");
    expect(textoFinal(turno2)).toBe(SIGO);
    expect(pedidos).toHaveLength(2);
    historialesSanos(pedidos);
  });

  test("con el respaldo activo un 402 tampoco cambia de modelo: sigue siendo un solo pedido", async () => {
    const { fetch, pedidos } = crearFetchFalso([SIN_SALDO]);
    const prueba = crearAgenteFetch({ raiz: proyecto.raiz, fetch });

    const turno = await prueba.turno("hola");
    expect(pedidos).toHaveLength(1);
    expect(errores(turno).map((error) => error.codigo)).toEqual([CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO]);
  });

  test("un proveedor que no responde dentro de LLM_TIMEOUT_MS termina en PROVEEDOR_TIMEOUT y el turno siguiente funciona", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      ...veces(COLGADO, INTENTOS),
      { cuerpo: cuerpoConTexto(SIGO) },
    ]);
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: { ...SIN_RESPALDO, LLM_TIMEOUT_MS: "30" },
    });

    const turno1 = await prueba.turno("hola");
    expect(pedidos).toHaveLength(INTENTOS);
    expect(errores(turno1)).toEqual([
      expect.objectContaining({
        codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
        mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_TIMEOUT],
      }),
    ]);

    const turno2 = await prueba.turno("¿sigues?");
    expect(textoFinal(turno2)).toBe(SIGO);
    expect(JSON.stringify(pedidos.map((registrado) => registrado.texto))).not.toContain(CLAVE_PRUEBA);
    historialesSanos(pedidos);
  });
});
