import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { AlmacenSesiones } from "@/application/types/puertos-agente.type.ts";
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
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import {
  createInstructionsLoader,
  DEFAULT_AGENT_DIRECTORY,
} from "@/infra/knowledge/instructions-loader.adapter.ts";
import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";
import type { FetchLike, ProviderSlot } from "@/llm/types/provider.type.ts";
import { ejecutarTurno, sesionVacia } from "@/loop/services/ejecutar-turno.service.ts";
import { crearRegistroHerramientas } from "@/loop/services/registro-herramientas.service.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { DependenciasTurno, Sesion } from "@/loop/types/turno.type.ts";
import * as proveedor from "@/tools/proveedor.ts";

const CLAVE = "clave-de-prueba-Zq9X";
const MARCA_CLAVE = "Zq9X";
const CASO = "co-industrias-delta";
const LLAMADA_ID = "call_00_JruUuew0lzqlTlBve0Dl0999";
const TEXTO_FINAL = "Leí la solicitud del caso co-industrias-delta.";

type Pedido = { readonly url: string; readonly cuerpo: string; readonly autorizacion: string | null };

type RespuestaFalsa = () => Response;

type CuerpoWire = {
  readonly model: string;
  readonly thinking?: { readonly type: string };
  readonly temperature?: number;
  readonly max_tokens?: number;
  readonly stream: boolean;
  readonly tool_choice?: string;
  readonly tools?: readonly {
    readonly function: { readonly name: string; readonly parameters: { readonly required?: string[] } };
  }[];
  readonly messages: readonly {
    readonly role: string;
    readonly content: string;
    readonly tool_call_id?: string;
    readonly tool_calls?: readonly { readonly id: string }[];
  }[];
};

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

const USO_SPIKE = {
  prompt_tokens: 350,
  completion_tokens: 48,
  total_tokens: 398,
  prompt_tokens_details: { cached_tokens: 0 },
  prompt_cache_hit_tokens: 0,
  prompt_cache_miss_tokens: 350,
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

function respuestaHerramienta(id: string, nombre: string, args: unknown): RespuestaFalsa {
  return () =>
    json({
      id: "redactado",
      object: "chat.completion",
      created: 0,
      model: PRESET_DEEPSEEK.model,
      choices: [
        {
          index: 0,
          finish_reason: "tool_calls",
          message: {
            role: "assistant",
            content: "",
            tool_calls: [
              { index: 0, id, type: "function", function: { name: nombre, arguments: JSON.stringify(args) } },
            ],
          },
        },
      ],
      usage: USO_SPIKE,
      system_fingerprint: "redactado",
    });
}

function respuestaTexto(texto: string): RespuestaFalsa {
  return () =>
    json({
      id: "redactado",
      object: "chat.completion",
      created: 0,
      model: PRESET_DEEPSEEK.model,
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: texto } }],
      usage: { ...USO_SPIKE, prompt_cache_hit_tokens: 256, prompt_tokens_details: { cached_tokens: 256 } },
    });
}

function respuestaNoDisponible(): Response {
  return new Response(`{"error":{"message":"Your api key: ****${MARCA_CLAVE} is invalid"}}`, { status: 503 });
}

function crearFetchFalso(guion: readonly RespuestaFalsa[]): { fetch: FetchLike; pedidos: Pedido[] } {
  const pedidos: Pedido[] = [];
  let indice = 0;
  const fetch: FetchLike = async (url, init) => {
    const cabeceras = new Headers(init.headers);
    pedidos.push({ url, cuerpo: String(init.body), autorizacion: cabeceras.get("Authorization") });
    const paso = guion[indice];
    indice += 1;
    if (paso === undefined) throw new Error("guion agotado");
    return paso();
  };
  return { fetch, pedidos };
}

function almacenEnMemoria(nuevoId: () => string): AlmacenSesiones<Sesion> {
  const sesiones = new Map<string, Sesion>();
  return {
    abrir(id) {
      const existente = id === null ? undefined : sesiones.get(id);
      if (existente !== undefined) return { sesion: existente, nueva: false, expirada: false };
      return { sesion: sesionVacia(nuevoId()), nueva: true, expirada: id !== null };
    },
    guardar(sesion) {
      sesiones.set(sesion.id, sesion);
    },
    ocupar: () => true,
    liberar: () => undefined,
  };
}

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
  return {
    llm: createOpenAICompatibleAdapter(SLOT, { fetch }),
    herramientas: crearRegistroHerramientas(proveedor),
    instrucciones: createInstructionsLoader(),
    sesiones: almacenEnMemoria(nuevoId),
    directorio: proyecto.raiz,
    maxIteraciones: MAX_ITERACIONES_POR_DEFECTO,
    nuevoId,
  };
}

async function turno(
  deps: DependenciasTurno,
  mensaje: string,
  sesionId: string | null,
): Promise<EventoAgente[]> {
  const eventos: EventoAgente[] = [];
  for await (const evento of ejecutarTurno({ sesionId, mensaje }, deps)) eventos.push(evento);
  return eventos;
}

function cuerpoDe(pedido: Pedido | undefined): CuerpoWire {
  if (pedido === undefined) throw new Error("pedido ausente");
  return JSON.parse(pedido.cuerpo);
}

function sesionDe(eventos: readonly EventoAgente[]): string {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
  return inicio.sesionId;
}

function historialIntegro(mensajes: CuerpoWire["messages"]): boolean {
  return mensajes.every((mensaje, indice) => {
    const llamadas = mensaje.tool_calls ?? [];
    const siguientes = mensajes.slice(indice + 1, indice + 1 + llamadas.length);
    return llamadas.every((llamada, posicion) => siguientes[posicion]?.tool_call_id === llamada.id);
  });
}

describe("trazador del agente: mensaje → bucle → adaptador → herramienta real → eventos", () => {
  test("procesa el caso co-industrias-delta de punta a punta y un segundo turno reproduce el historial", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      respuestaHerramienta(LLAMADA_ID, "proveedor_leer_solicitud", { caso: CASO }),
      respuestaTexto(TEXTO_FINAL),
      respuestaTexto("Listo."),
    ]);
    const deps = crearDependencias(fetch);
    const eventos = await turno(deps, `procesa el caso ${CASO}`, null);

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

    const primero = cuerpoDe(pedidos[0]);
    expect(pedidos[0]?.url).toBe("https://api.deepseek.com/chat/completions");
    expect(pedidos[0]?.autorizacion).toBe(`Bearer ${CLAVE}`);
    expect(primero).toMatchObject({
      model: "deepseek-flash",
      thinking: { type: "disabled" },
      temperature: 0,
      max_tokens: 2048,
      stream: false,
      tool_choice: "auto",
    });
    const herramientas = primero.tools ?? [];
    expect(herramientas.map((herramienta) => herramienta.function.name).sort()).toEqual([
      "proveedor_armar_paquete",
      "proveedor_generar_formulario",
      "proveedor_leer_solicitud",
      "proveedor_mapear_campos",
      "proveedor_simular_envio",
    ]);
    const simular = herramientas.find(
      (herramienta) => herramienta.function.name === "proveedor_simular_envio",
    );
    expect(simular?.function.parameters.required).toEqual(["caso"]);
    expect(simular?.function.parameters).toMatchObject({ additionalProperties: false });
    expect(JSON.stringify(simular?.function.parameters)).not.toContain("$schema");

    const prompt = await readFile(join(DEFAULT_AGENT_DIRECTORY, "prompt.md"), "utf8");
    const primeraLinea = prompt.split("\n")[0] ?? "";
    expect(primeraLinea.length).toBeGreaterThan(0);
    expect(primero.messages.map((mensaje) => mensaje.role)).toEqual(["system", "user"]);
    expect(primero.messages[0]?.content.startsWith(primeraLinea)).toBe(true);
    expect(primero.messages[0]?.content).toContain("proveedor_leer_solicitud");

    const segundo = cuerpoDe(pedidos[1]);
    const mensajeHerramienta = segundo.messages.find((mensaje) => mensaje.role === "tool");
    expect(mensajeHerramienta?.tool_call_id).toBe(LLAMADA_ID);
    expect(mensajeHerramienta?.content).toContain(CASO);
    expect(segundo.messages.map((mensaje) => mensaje.role)).toEqual(["system", "user", "assistant", "tool"]);

    const solicitud = JSON.parse(
      await readFile(join(proyecto.raiz, FIXTURES_DIR, CASOS_DIR, CASO, "solicitud.json"), "utf8"),
    );
    const lineasCuerpo = String(solicitud.cuerpo)
      .split("\n")
      .filter((linea) => linea.length > 20);
    expect(lineasCuerpo.length).toBeGreaterThan(0);
    for (const pedido of pedidos) {
      expect(pedido.cuerpo).not.toContain(CLAVE);
      for (const linea of lineasCuerpo) expect(pedido.cuerpo).not.toContain(linea);
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

    const segundoTurno = await turno(deps, "gracias", sesionId);
    expect(sesionDe(segundoTurno)).toBe(sesionId);
    expect(segundoTurno.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    const tercero = cuerpoDe(pedidos[2]);
    expect(tercero.messages.map((mensaje) => mensaje.role)).toEqual([
      "system",
      "user",
      "assistant",
      "tool",
      "assistant",
      "user",
    ]);
    expect(tercero.messages[2]?.tool_calls?.map((llamada) => llamada.id)).toEqual([LLAMADA_ID]);
    expect(tercero.messages[4]?.content).toBe(TEXTO_FINAL);
    for (const pedido of pedidos) expect(historialIntegro(cuerpoDe(pedido).messages)).toBe(true);
  });

  test("un 503 del proveedor es un evento del catálogo, no filtra la clave y la sesión sigue viva", async () => {
    const { fetch, pedidos } = crearFetchFalso([respuestaNoDisponible, respuestaTexto("Hola de nuevo.")]);
    const deps = crearDependencias(fetch);
    const eventos = await turno(deps, `procesa el caso ${CASO}`, null);

    expect(eventos.map((evento) => evento.tipo)).toEqual(["turn_start", "error", "turn_end"]);
    expect(eventos[1]).toEqual({
      tipo: TIPO_EVENTO.ERROR,
      turnoId: expect.any(String),
      codigo: CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE,
      mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE],
    });
    expect(eventos[2]).toMatchObject({ motivo: MOTIVO_FIN.ERROR, needsConfirmation: false });
    expect(JSON.stringify(eventos)).not.toContain(MARCA_CLAVE);

    const siguiente = await turno(deps, "hola", sesionDe(eventos));
    expect(siguiente.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    expect(JSON.stringify(siguiente)).not.toContain(MARCA_CLAVE);
    const reintento = cuerpoDe(pedidos[1]);
    expect(reintento.messages.map((mensaje) => mensaje.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(reintento.messages[2]?.content).toBe(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
    expect(reintento.messages.map((mensaje) => mensaje.content).join("\n")).not.toContain(MARCA_CLAVE);
  });

  test("el adaptador no lanza con una señal ya abortada y atiende llamadas concurrentes sin estado compartido", async () => {
    const { fetch, pedidos } = crearFetchFalso([respuestaTexto("uno"), respuestaTexto("dos")]);
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
    expect(cuerpoDe(pedidos[0])).not.toHaveProperty("tools");
  });
});
