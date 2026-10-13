import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { MensajeWire, PedidoRegistrado, RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import {
  CODIGO_AGENTE,
  MAX_ITERACIONES_POR_DEFECTO,
  MOTIVO_FIN,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CASOS_DIR, FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import {
  MAX_TOKENS_SALIDA_POR_DEFECTO,
  PRESET_DEEPSEEK,
  PROVEEDOR_DEEPSEEK,
  TIPO_ERROR_LLM,
} from "@/config/constants/llm.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE, TEXTO_CONTEXTO } from "@/config/strings.ts";
import { fixedClock } from "@/infra/clock/clock.adapter.ts";
import {
  createInstructionsLoader,
  DEFAULT_AGENT_DIRECTORY,
} from "@/infra/knowledge/instructions-loader.adapter.ts";
import { createAuditLog } from "@/infra/logging/audit-log.adapter.ts";
import { createMemorySessionStore } from "@/infra/sessions/memory-session-store.adapter.ts";
import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";
import type { FetchLike, ProviderSlot } from "@/llm/types/provider.type.ts";
import { ejecutarTurno, sesionVacia } from "@/loop/services/ejecutar-turno.service.ts";
import { crearRegistroHerramientas } from "@/loop/services/registro-herramientas.service.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { DependenciasTurno, Sesion } from "@/loop/types/turno.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";
import * as proveedor from "@/tools/proveedor.ts";

const CLAVE = "clave-de-prueba-Zq9X";
const MARCA_CLAVE = "Zq9X";
const CASO = "co-industrias-delta";
const LLAMADA_ID = "call_00_JruUuew0lzqlTlBve0Dl0999";
const TEXTO_FINAL = "Leí la solicitud del caso co-industrias-delta.";
const TTL_PRUEBA_MS = 60_000;
const MAX_SESIONES_PRUEBA = 10;

const SLOT: ProviderSlot = {
  provider: PROVEEDOR_DEEPSEEK,
  baseUrl: PRESET_DEEPSEEK.baseUrl,
  model: PRESET_DEEPSEEK.model,
  apiKey: CLAVE,
  maxOutputTokens: MAX_TOKENS_SALIDA_POR_DEFECTO,
  capabilities: {
    maxTokensParam: PRESET_DEEPSEEK.maxTokensParam,
    temperature: PRESET_DEEPSEEK.temperature,
    thinking: PRESET_DEEPSEEK.thinking,
    reasoningPassback: PRESET_DEEPSEEK.reasoningPassback,
    toolChoiceNone: PRESET_DEEPSEEK.toolChoiceNone,
  },
};

const NO_DISPONIBLE: RespuestaGuion = {
  estado: 503,
  cuerpo: `{"error":{"message":"Your api key: ****${MARCA_CLAVE} is invalid"}}`,
};

const GUION_CASO: readonly RespuestaGuion[] = [
  {
    cuerpo: cuerpoConHerramientas({
      nombre: "proveedor_leer_solicitud",
      argumentos: { caso: CASO },
      id: LLAMADA_ID,
    }),
  },
  { cuerpo: cuerpoConTexto(TEXTO_FINAL) },
  { cuerpo: cuerpoConTexto("Listo.") },
];

type Turnar = (mensaje: string, sesionId: string | null) => Promise<EventoAgente[]>;

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

function crearDependencias(fetch: FetchLike): DependenciasTurno {
  const nuevoId = () => crypto.randomUUID();
  const reloj = fixedClock(FECHA_DEMO);
  return {
    llm: createOpenAICompatibleAdapter(SLOT, { fetch }),
    herramientas: crearRegistroHerramientas(proveedor),
    instrucciones: createInstructionsLoader(),
    sesiones: createMemorySessionStore<Sesion>({
      create: sesionVacia,
      newId: nuevoId,
      ttlMs: TTL_PRUEBA_MS,
      maxSessions: MAX_SESIONES_PRUEBA,
      now: () => Date.now(),
    }),
    reloj,
    registrar: createAuditLog(proyecto.raiz, reloj),
    directorio: proyecto.raiz,
    maxIteraciones: MAX_ITERACIONES_POR_DEFECTO,
    nuevoId,
  };
}

async function recoger(eventos: AsyncIterable<EventoAgente>): Promise<EventoAgente[]> {
  const recogidos: EventoAgente[] = [];
  for await (const evento of eventos) recogidos.push(evento);
  return recogidos;
}

function turnarConDependencias(deps: DependenciasTurno): Turnar {
  return (mensaje, sesionId) => recoger(ejecutarTurno({ sesionId, mensaje }, deps));
}

function turnarConAgente(fetch: FetchLike): Turnar {
  const creacion = crearAgente({ directorio: proyecto.raiz, fetch, fuenteEntorno: { LLM_API_KEY: CLAVE } });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  const { agente } = creacion;
  return (mensaje, sesionId) => recoger(agente.turno({ sesionId, mensaje }));
}

function sesionDe(eventos: readonly EventoAgente[]): string {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
  return inicio.sesionId;
}

function mensajesDe(pedido: PedidoRegistrado | undefined): readonly MensajeWire[] {
  if (pedido === undefined) throw new Error("pedido ausente");
  return pedido.cuerpo.messages;
}

function historialIntegro(mensajes: readonly MensajeWire[]): boolean {
  return mensajes.every((mensaje, indice) => {
    const llamadas = mensaje.tool_calls ?? [];
    const siguientes = mensajes.slice(indice + 1, indice + 1 + llamadas.length);
    return llamadas.every((llamada, posicion) => siguientes[posicion]?.tool_call_id === llamada.id);
  });
}

async function procesarCasoDePuntaAPunta(
  turnar: Turnar,
  pedidos: readonly PedidoRegistrado[],
): Promise<void> {
  const eventos = await turnar(`procesa el caso ${CASO}`, null);

  expect(eventos.map((evento) => evento.tipo)).toEqual([
    "turn_start",
    "usage",
    "tool_start",
    "tool_end",
    "usage",
    "text",
    "turn_end",
  ]);
  const finHerramienta = eventos.find((evento) => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA);
  expect(finHerramienta).toMatchObject({
    ok: true,
    herramienta: "proveedor_leer_solicitud",
    llamadaId: LLAMADA_ID,
  });
  expect(eventos.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL, needsConfirmation: false });
  expect(eventos.find((evento) => evento.tipo === TIPO_EVENTO.TEXTO)).toMatchObject({ texto: TEXTO_FINAL });
  expect(eventos[1]).toMatchObject({ entrada: 350, salida: 48, cacheHit: 0, totalSesion: 398 });
  expect(eventos[4]).toMatchObject({ cacheHit: 256, totalSesion: 796, modelo: PRESET_DEEPSEEK.model });

  const primero = pedidos[0];
  if (primero === undefined) throw new Error("pedido ausente");
  expect(primero.url).toBe("https://api.deepseek.com/chat/completions");
  expect(primero.cabeceras.authorization).toBe(`Bearer ${CLAVE}`);
  expect(primero.cuerpo).toMatchObject({
    model: "deepseek-flash",
    thinking: { type: "disabled" },
    temperature: 0,
    max_tokens: 2048,
    stream: false,
    tool_choice: "auto",
  });
  const herramientas = primero.cuerpo.tools ?? [];
  expect(herramientas.map((herramienta) => herramienta.function.name).sort()).toEqual([
    "proveedor_armar_paquete",
    "proveedor_generar_formulario",
    "proveedor_leer_solicitud",
    "proveedor_mapear_campos",
    "proveedor_simular_envio",
  ]);
  const simular = herramientas.find((herramienta) => herramienta.function.name === "proveedor_simular_envio");
  expect(simular?.function.parameters.required).toEqual(["caso"]);
  expect(simular?.function.parameters).toMatchObject({ additionalProperties: false });
  expect(JSON.stringify(simular?.function.parameters)).not.toContain("$schema");

  const prompt = await readFile(join(DEFAULT_AGENT_DIRECTORY, "prompt.md"), "utf8");
  const primeraLinea = prompt.split("\n")[0] ?? "";
  expect(primeraLinea.length).toBeGreaterThan(0);
  const mensajesPrimero = mensajesDe(primero);
  expect(mensajesPrimero.map((mensaje) => mensaje.role)).toEqual(["system", "system", "user"]);
  expect(mensajesPrimero[0]?.content.startsWith(primeraLinea)).toBe(true);
  expect(mensajesPrimero[0]?.content).toContain("proveedor_leer_solicitud");
  expect(mensajesPrimero[1]?.content).toBe(TEXTO_CONTEXTO.fecha(FECHA_DEMO));

  const segundo = mensajesDe(pedidos[1]);
  const mensajeHerramienta = segundo.find((mensaje) => mensaje.role === "tool");
  expect(mensajeHerramienta?.tool_call_id).toBe(LLAMADA_ID);
  expect(mensajeHerramienta?.content).toContain(CASO);
  expect(segundo.map((mensaje) => mensaje.role)).toEqual(["system", "system", "user", "assistant", "tool"]);

  const solicitud = JSON.parse(
    await readFile(join(proyecto.raiz, FIXTURES_DIR, CASOS_DIR, CASO, "solicitud.json"), "utf8"),
  );
  const lineasCuerpo = String(solicitud.cuerpo)
    .split("\n")
    .filter((linea) => linea.length > 20);
  expect(lineasCuerpo.length).toBeGreaterThan(0);
  for (const pedido of pedidos) {
    expect(pedido.texto).not.toContain(CLAVE);
    for (const linea of lineasCuerpo) expect(pedido.texto).not.toContain(linea);
  }
  expect(JSON.stringify(eventos)).not.toContain(CLAVE);

  const sesionId = sesionDe(eventos);
  const bitacora = (await readFile(join(proyecto.raiz, "out", "log.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((linea) => JSON.parse(linea));
  expect(
    bitacora.some((linea) => linea.herramienta === "proveedor_leer_solicitud" && linea.sesion === sesionId),
  ).toBe(true);

  const segundoTurno = await turnar("gracias", sesionId);
  expect(sesionDe(segundoTurno)).toBe(sesionId);
  expect(segundoTurno.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
  const tercero = mensajesDe(pedidos[2]);
  expect(tercero.map((mensaje) => mensaje.role)).toEqual([
    "system",
    "system",
    "user",
    "assistant",
    "tool",
    "assistant",
    "user",
  ]);
  expect(tercero[3]?.tool_calls?.map((llamada) => llamada.id)).toEqual([LLAMADA_ID]);
  expect(tercero[5]?.content).toBe(TEXTO_FINAL);
  for (const pedido of pedidos) expect(historialIntegro(mensajesDe(pedido))).toBe(true);
}

describe("trazador del agente: mensaje → bucle → adaptador → herramienta real → eventos", () => {
  test("procesa el caso co-industrias-delta de punta a punta y un segundo turno reproduce el historial", async () => {
    const { fetch, pedidos } = crearFetchFalso(GUION_CASO);
    await procesarCasoDePuntaAPunta(turnarConDependencias(crearDependencias(fetch)), pedidos);
  });

  test("el mismo caso pasa igual por crearAgente con el fetch inyectado", async () => {
    const { fetch, pedidos } = crearFetchFalso(GUION_CASO);
    await procesarCasoDePuntaAPunta(turnarConAgente(fetch), pedidos);
  });

  test("un 503 del proveedor es un evento del catálogo, no filtra la clave y la sesión sigue viva", async () => {
    const { fetch, pedidos } = crearFetchFalso([NO_DISPONIBLE, { cuerpo: cuerpoConTexto("Hola de nuevo.") }]);
    const turnar = turnarConDependencias(crearDependencias(fetch));
    const eventos = await turnar(`procesa el caso ${CASO}`, null);

    expect(eventos.map((evento) => evento.tipo)).toEqual(["turn_start", "error", "turn_end"]);
    expect(eventos[1]).toEqual({
      tipo: TIPO_EVENTO.ERROR,
      turnoId: expect.any(String),
      codigo: CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE,
      mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE],
    });
    expect(eventos[2]).toMatchObject({ motivo: MOTIVO_FIN.ERROR, needsConfirmation: false });
    expect(JSON.stringify(eventos)).not.toContain(MARCA_CLAVE);

    const siguiente = await turnar("hola", sesionDe(eventos));
    expect(siguiente.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    expect(JSON.stringify(siguiente)).not.toContain(MARCA_CLAVE);
    const reintento = mensajesDe(pedidos[1]);
    expect(reintento.map((mensaje) => mensaje.role)).toEqual([
      "system",
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(reintento[3]?.content).toBe(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
    expect(reintento.map((mensaje) => mensaje.content).join("\n")).not.toContain(MARCA_CLAVE);
  });

  test("el adaptador no lanza con una señal ya abortada y atiende llamadas concurrentes sin estado compartido", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("uno") },
      { cuerpo: cuerpoConTexto("dos") },
    ]);
    const adaptador = createOpenAICompatibleAdapter(SLOT, { fetch });
    const controlador = new AbortController();
    controlador.abort();
    const abortado = await adaptador.enviar([], [], {
      signal: controlador.signal,
      herramientasDesactivadas: false,
    });
    expect(abortado).toMatchObject({
      ok: false,
      error: { tipo: TIPO_ERROR_LLM.ABORTADO, reintentable: false },
    });
    expect(pedidos).toHaveLength(0);

    const opciones = { signal: new AbortController().signal, herramientasDesactivadas: false };
    const [a, b] = await Promise.all([
      adaptador.enviar([], [], opciones),
      adaptador.enviar([], [], opciones),
    ]);
    const textos = [a, b].map((resultado) => (resultado.ok ? resultado.respuesta.texto : null));
    expect(textos).toEqual(["uno", "dos"]);
    expect(pedidos).toHaveLength(2);
    expect(pedidos[0]?.cuerpo).not.toHaveProperty("tools");
  });
});
