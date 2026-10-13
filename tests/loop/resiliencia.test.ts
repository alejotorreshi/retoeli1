import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA, crearAgenteFetch } from "@tests/helpers/agente-fetch.helper.ts";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import {
  confirmaciones,
  errores,
  finDeTurno,
  lineasBitacora,
  textoFinal,
} from "@tests/helpers/eventos.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { historialIntegro, historialWireIntegro } from "@tests/helpers/historial.helper.ts";
import {
  llamar,
  pasoGenerarConMapeo,
  respuestaHerramientas,
  respuestaTexto,
} from "@tests/helpers/llm-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { PedidoRegistrado, RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { PasoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ESTADO_COMPUERTA } from "@/config/constants/confirmacion.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { FIN_LLM, REINTENTOS_LLM_POR_DEFECTO, ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { Mensaje } from "@/llm/types/llm.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

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
const EC = "ec-corp-andina";
const MAXIMO_ANTES_DEL_TIMEOUT_MS = 2_000;
const INTERRUMPIDO = MENSAJE_AGENTE[CODIGO_AGENTE.TURNO_INTERRUMPIDO];
const PASO_DOBLE = respuestaHerramientas(
  llamar("leer-a", HERRAMIENTA.LEER_SOLICITUD, { caso: EC }),
  llamar("mapear-b", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] }),
);
const ARMADO_EC: readonly PasoLlmFalso[] = [
  respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
  respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
  pasoGenerarConMapeo(EC),
  respuestaHerramientas(llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
];

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

function idsDeLlamadas(mensajes: readonly Mensaje[]): string[] {
  return mensajes.flatMap((mensaje) =>
    mensaje.rol === ROL_MENSAJE.ASISTENTE ? mensaje.llamadas.map((llamada) => llamada.id) : [],
  );
}

function pedidosSanos(prueba: AgentePrueba): void {
  for (const registrado of prueba.llm.pedidos) expect(historialIntegro(registrado.mensajes)).toEqual([]);
}

function esInicioDe(evento: EventoAgente, llamadaId: string): boolean {
  return evento.tipo === TIPO_EVENTO.INICIO_HERRAMIENTA && evento.llamadaId === llamadaId;
}

describe("las interrupciones nunca corrompen la sesión (AGT-04, CA5)", () => {
  test("AGENT_TURN_DEADLINE_MS corta el turno con TIEMPO_TURNO_AGOTADO mucho antes del timeout por llamada", async () => {
    const { fetch, pedidos } = crearFetchFalso([COLGADO, { cuerpo: cuerpoConTexto(SIGO) }]);
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: { ...SIN_RESPALDO, AGENT_TURN_DEADLINE_MS: "60", LLM_TIMEOUT_MS: "5000" },
    });

    const inicio = performance.now();
    const turno1 = await prueba.turno("hola");
    expect(performance.now() - inicio).toBeLessThan(MAXIMO_ANTES_DEL_TIMEOUT_MS);
    expect(pedidos).toHaveLength(1);
    expect(errores(turno1)).toEqual([
      expect.objectContaining({
        codigo: CODIGO_AGENTE.TIEMPO_TURNO_AGOTADO,
        mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.TIEMPO_TURNO_AGOTADO],
      }),
    ]);
    expect(finDeTurno(turno1).motivo).toBe(MOTIVO_FIN.ERROR);

    const turno2 = await prueba.turno("¿sigues?");
    expect(textoFinal(turno2)).toBe(SIGO);
    historialesSanos(pedidos);
  });

  test("un aborto del llamante termina en abortado, sin otro pedido, descarta el paso a medias y deja la compuerta LIBRE", async () => {
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [...ARMADO_EC, PASO_DOBLE, respuestaTexto(SIGO)],
    });
    const controlador = new AbortController();
    const eventos: EventoAgente[] = [];
    for await (const evento of prueba.iniciar(`procesa el caso ${EC}`, { signal: controlador.signal })) {
      eventos.push(evento);
      if (esInicioDe(evento, "leer-a")) controlador.abort();
    }

    expect(finDeTurno(eventos)).toMatchObject({ motivo: MOTIVO_FIN.ABORTADO, needsConfirmation: false });
    expect(prueba.llm.pedidos).toHaveLength(ARMADO_EC.length + 1);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(
      eventos.filter(
        (evento) => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA && evento.llamadaId === "leer-a",
      ),
    ).toEqual([]);
    const sesion = prueba.sesionActual();
    expect(sesion.compuerta.tipo).toBe(ESTADO_COMPUERTA.LIBRE);
    expect(historialIntegro(sesion.historial)).toEqual([]);
    expect(idsDeLlamadas(sesion.historial)).toEqual(["leer-1", "mapear-1", `generar-${EC}`, "armar-1"]);
    expect(sesion.historial.at(-1)).toMatchObject({ rol: ROL_MENSAJE.ASISTENTE, contenido: INTERRUMPIDO });

    const siguiente = await prueba.turno("sigue");
    expect(textoFinal(siguiente)).toBe(SIGO);
    expect(finDeTurno(siguiente).needsConfirmation).toBe(false);
    pedidosSanos(prueba);
  });

  test("un generador abandonado con return() a mitad de paso guarda los pasos completos y libera la sesión", async () => {
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [
        respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
        PASO_DOBLE,
        respuestaTexto(SIGO),
      ],
    });
    const turno = prueba.iniciar(`procesa el caso ${EC}`);
    for await (const evento of turno) {
      if (esInicioDe(evento, "leer-a")) break;
    }

    const sesion = prueba.sesionActual();
    expect(sesion.compuerta.tipo).toBe(ESTADO_COMPUERTA.LIBRE);
    expect(historialIntegro(sesion.historial)).toEqual([]);
    expect(sesion.historial.map((mensaje) => mensaje.rol)).toEqual([
      ROL_MENSAJE.USUARIO,
      ROL_MENSAJE.ASISTENTE,
      ROL_MENSAJE.HERRAMIENTA,
      ROL_MENSAJE.ASISTENTE,
    ]);
    expect(sesion.historial.at(-1)).toMatchObject({ contenido: INTERRUMPIDO, llamadas: [] });

    const siguiente = await prueba.turno("sigue");
    expect(finDeTurno(siguiente).motivo).toBe(MOTIVO_FIN.FINAL);
    expect(textoFinal(siguiente)).toBe(SIGO);
    pedidosSanos(prueba);
  });

  test("un paso cortado por limite no ejecuta herramientas y responde ARGUMENTOS_TRUNCADOS a cada llamada", async () => {
    const cortado = {
      ...respuestaHerramientas(
        llamar("leer-a", HERRAMIENTA.LEER_SOLICITUD, { caso: CASO }),
        llamar("leer-b", HERRAMIENTA.LEER_SOLICITUD, { caso: EC }),
      ),
      fin: FIN_LLM.LIMITE,
    };
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [cortado, respuestaTexto("Vuelvo a pedirla."), respuestaTexto(SIGO)],
    });

    const turno1 = await prueba.turno(`procesa el caso ${CASO}`);
    expect(await lineasBitacora(proyecto.raiz)).toEqual([]);
    expect(prueba.llm.pedidos).toHaveLength(2);
    const respuestas = (prueba.llm.pedidos[1]?.mensajes ?? []).filter(
      (mensaje) => mensaje.rol === ROL_MENSAJE.HERRAMIENTA,
    );
    expect(
      respuestas.map((mensaje) => (mensaje.rol === ROL_MENSAJE.HERRAMIENTA ? mensaje.llamadaId : "")),
    ).toEqual(["leer-a", "leer-b"]);
    for (const respuesta of respuestas) {
      expect(JSON.parse(respuesta.contenido)).toEqual({
        ok: false,
        codigo: CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS,
        error: MENSAJE_AGENTE[CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS],
      });
    }
    expect(textoFinal(turno1)).toBe("Vuelvo a pedirla.");

    const siguiente = await prueba.turno("¿sigues?");
    expect(textoFinal(siguiente)).toBe(SIGO);
    pedidosSanos(prueba);
  });
});
