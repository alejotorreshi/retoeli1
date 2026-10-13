import { describe, expect, test } from "bun:test";
import {
  CABECERA_HTTP,
  CAPACIDADES_GENERICAS,
  CARACTERES_POR_TOKEN,
  FIN_LLM,
  FINISH_REASON,
  MODO_THINKING,
  MS_POR_SEGUNDO,
  PARAMETRO_MAX_TOKENS,
  ROL_MENSAJE,
  TIPO_ERROR_LLM,
  TOOL_CHOICE,
} from "@/config/constants/llm.constants.ts";
import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";
import type { DefinicionHerramienta, Mensaje, OpcionesEnvio, ResultadoEnvio } from "@/llm/types/llm.type.ts";
import type { FetchLike, ProviderCapabilities, ProviderSlot } from "@/llm/types/provider.type.ts";

const FIXTURE_HERRAMIENTAS = new URL("../fixtures/llm/completion-tool-calls.json", import.meta.url);
const FIXTURE_TEXTO = new URL("../fixtures/llm/completion-texto.json", import.meta.url);
const FUENTE_ADAPTADOR = new URL("../../src/llm/adapters/openai-compatible.adapter.ts", import.meta.url);

const MAX_SALIDA = 512;
const CACHE_HIT_ALTERNATIVO = 256;
const SEGUNDOS_REINTENTO = 3;
const MARCA_CLAVE = "Zq9X";
const LLAMADA_ID = "call_00_JruUuew0lzqlTlBve0Dl0999";

const MENSAJES: readonly Mensaje[] = [
  { rol: ROL_MENSAJE.SISTEMA, contenido: "Eres el agente de registro." },
  { rol: ROL_MENSAJE.USUARIO, contenido: "procesa el caso ec-corp-andina" },
];

const HISTORIAL_CON_RAZONAMIENTO: readonly Mensaje[] = [
  ...MENSAJES,
  {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: null,
    llamadas: [
      { id: LLAMADA_ID, nombre: "proveedor_leer_solicitud", argumentos: '{"caso":"ec-corp-andina"}' },
    ],
    razonamiento: "pienso leer la solicitud",
  },
  { rol: ROL_MENSAJE.HERRAMIENTA, llamadaId: LLAMADA_ID, contenido: '{"ok":true}' },
];

const DEFINICIONES: readonly DefinicionHerramienta[] = [
  {
    nombre: "proveedor_leer_solicitud",
    descripcion: "Lee la solicitud del caso.",
    parametros: { type: "object", properties: { caso: { type: "string" } }, required: ["caso"] },
  },
];

type Pedido = { readonly url: string; readonly texto: string; readonly cuerpo: Record<string, unknown> };

type Respondedor = (init: RequestInit) => Response | Promise<Response>;

function slotCon(capacidades: Partial<ProviderCapabilities> = {}): ProviderSlot {
  return {
    provider: "generico",
    baseUrl: "https://proveedor.example",
    model: "modelo-de-prueba",
    apiKey: `clave-de-prueba-${MARCA_CLAVE}`,
    maxOutputTokens: MAX_SALIDA,
    capabilities: { ...CAPACIDADES_GENERICAS, ...capacidades },
  };
}

function fetchFalso(responder: Respondedor): { readonly fetch: FetchLike; readonly pedidos: Pedido[] } {
  const pedidos: Pedido[] = [];
  const fetch: FetchLike = async (url, init) => {
    const texto = String(init.body);
    pedidos.push({ url, texto, cuerpo: JSON.parse(texto) });
    return responder(init);
  };
  return { fetch, pedidos };
}

function json(cuerpo: unknown, estado = 200, cabeceras: Record<string, string> = {}): Response {
  return new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...cabeceras },
  });
}

function opciones(herramientasDesactivadas = false, signal = new AbortController().signal): OpcionesEnvio {
  return { signal, herramientasDesactivadas };
}

async function enviarCon(
  responder: Respondedor,
  capacidades: Partial<ProviderCapabilities> = {},
  mensajes: readonly Mensaje[] = MENSAJES,
  definiciones: readonly DefinicionHerramienta[] = DEFINICIONES,
  desactivadas = false,
): Promise<{ readonly resultado: ResultadoEnvio; readonly pedidos: Pedido[] }> {
  const falso = fetchFalso(responder);
  const adaptador = createOpenAICompatibleAdapter(slotCon(capacidades), { fetch: falso.fetch });
  const resultado = await adaptador.enviar(mensajes, definiciones, opciones(desactivadas));
  return { resultado, pedidos: falso.pedidos };
}

async function leerFixture(url: URL): Promise<string> {
  return Bun.file(url).text();
}

async function fixtureHerramientas(): Promise<Record<string, unknown>> {
  return JSON.parse(await leerFixture(FIXTURE_HERRAMIENTAS));
}

async function fixtureTexto(): Promise<Record<string, unknown>> {
  return JSON.parse(await leerFixture(FIXTURE_TEXTO));
}

function conFin(cuerpo: Record<string, unknown>, fin: string): Record<string, unknown> {
  const [eleccion] = cuerpo.choices as Record<string, unknown>[];
  return { ...cuerpo, choices: [{ ...eleccion, finish_reason: fin }] };
}

function tipoDeError(resultado: ResultadoEnvio): string | null {
  return resultado.ok ? null : resultado.error.tipo;
}

describe("cuerpos capturados en el spike", () => {
  test("la respuesta con tool_calls se normaliza", async () => {
    const { resultado } = await enviarCon(async () => json(await leerFixture(FIXTURE_HERRAMIENTAS)));
    expect(resultado).toEqual({
      ok: true,
      respuesta: {
        texto: null,
        llamadas: [
          { id: LLAMADA_ID, nombre: "proveedor_leer_solicitud", argumentos: '{"caso": "ec-corp-andina"}' },
        ],
        uso: { entrada: 350, salida: 48, cacheHit: 0 },
        razonamiento: null,
        fin: FIN_LLM.HERRAMIENTAS,
        proveedor: "generico",
        modelo: "deepseek-flash",
      },
    });
  });

  test("cacheHit cae a prompt_cache_hit_tokens sin prompt_tokens_details", async () => {
    const cuerpo = await fixtureHerramientas();
    const uso = cuerpo.usage as Record<string, unknown>;
    const { prompt_tokens_details: _omitido, ...resto } = uso;
    const { resultado } = await enviarCon(() =>
      json({ ...cuerpo, usage: { ...resto, prompt_cache_hit_tokens: CACHE_HIT_ALTERNATIVO } }),
    );
    expect(resultado.ok && resultado.respuesta.uso.cacheHit).toBe(CACHE_HIT_ALTERNATIVO);
  });

  test("un cuerpo con líneas en blanco de keep-alive al inicio se lee", async () => {
    const { resultado } = await enviarCon(async () => json(`\n\n${await leerFixture(FIXTURE_HERRAMIENTAS)}`));
    expect(resultado.ok && resultado.respuesta.llamadas.length).toBe(1);
  });

  test("la respuesta de texto conserva el contenido y el cache hit", async () => {
    const { resultado } = await enviarCon(async () => json(await leerFixture(FIXTURE_TEXTO)));
    expect(resultado.ok && resultado.respuesta.fin).toBe(FIN_LLM.TEXTO);
    expect(resultado.ok && resultado.respuesta.texto).toContain("ec-corp-andina");
    expect(resultado.ok && resultado.respuesta.uso.cacheHit).toBe(CACHE_HIT_ALTERNATIVO);
  });
});

describe("estados HTTP", () => {
  test.each([
    [400, TIPO_ERROR_LLM.PETICION_INVALIDA],
    [404, TIPO_ERROR_LLM.PETICION_INVALIDA],
    [422, TIPO_ERROR_LLM.PETICION_INVALIDA],
    [401, TIPO_ERROR_LLM.AUTENTICACION],
    [403, TIPO_ERROR_LLM.AUTENTICACION],
    [402, TIPO_ERROR_LLM.SALDO],
    [500, TIPO_ERROR_LLM.SERVIDOR],
    [503, TIPO_ERROR_LLM.SERVIDOR],
  ])("%d se mapea a %s", async (estado, tipo) => {
    const { resultado } = await enviarCon(() => json({ error: { message: "x" } }, estado));
    expect(tipoDeError(resultado)).toBe(tipo);
  });

  test("429 con Retry-After en segundos fija reintentarTrasMs", async () => {
    const { resultado } = await enviarCon(() =>
      json({}, 429, { [CABECERA_HTTP.REINTENTAR_TRAS]: String(SEGUNDOS_REINTENTO) }),
    );
    expect(resultado).toEqual({
      ok: false,
      error: {
        tipo: TIPO_ERROR_LLM.LIMITE_TASA,
        reintentable: true,
        estado: 429,
        reintentarTrasMs: SEGUNDOS_REINTENTO * MS_POR_SEGUNDO,
      },
    });
  });

  test("429 con Retry-After como fecha HTTP no fija espera", async () => {
    const { resultado } = await enviarCon(() =>
      json({}, 429, { [CABECERA_HTTP.REINTENTAR_TRAS]: "Wed, 21 Oct 2026 07:28:00 GMT" }),
    );
    expect(resultado.ok ? undefined : resultado.error.reintentarTrasMs).toBeNull();
  });

  test("F1: un 401 JSON que repite la cola de la clave no la filtra", async () => {
    const { resultado } = await enviarCon(() =>
      json(
        {
          error: {
            message: `Authentication Fails, Your api key: ****${MARCA_CLAVE} is invalid (request_id: x)`,
            type: "authentication_error",
            param: null,
            code: "invalid_request_error",
          },
        },
        401,
      ),
    );
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.AUTENTICACION);
    const serializado = JSON.stringify(resultado);
    expect(serializado).not.toContain(MARCA_CLAVE);
    expect(serializado).not.toContain("Authentication");
  });

  test("F2: un 401 de texto plano sin content-type es autenticacion", async () => {
    const { resultado } = await enviarCon(
      () => new Response(`Authentication Fails (governor) ****${MARCA_CLAVE}`, { status: 401 }),
    );
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.AUTENTICACION);
    const serializado = JSON.stringify(resultado);
    expect(serializado).not.toContain(MARCA_CLAVE);
    expect(serializado).not.toContain("Authentication");
  });
});

describe("respuestas 200 problemáticas", () => {
  test.each([
    ["un cuerpo que no es JSON", "no es json"],
    ["choices vacío", { model: "m", choices: [] }],
    ["un cuerpo fuera del esquema", { model: 7, choices: "nada" }],
  ])("%s es respuesta_invalida reintentable", async (_nombre, cuerpo) => {
    const { resultado } = await enviarCon(() => json(cuerpo));
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.RESPUESTA_INVALIDA);
    expect(resultado.ok ? null : resultado.error.reintentable).toBe(true);
  });

  test("content_filter es filtro_contenido y no se reintenta", async () => {
    const cuerpo = conFin(await fixtureTexto(), FINISH_REASON.CONTENT_FILTER);
    const { resultado } = await enviarCon(() => json(cuerpo));
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.FILTRO_CONTENIDO);
    expect(resultado.ok ? null : resultado.error.reintentable).toBe(false);
  });

  test.each([FINISH_REASON.INSUFFICIENT_SYSTEM_RESOURCE, FINISH_REASON.ERROR])(
    "%s es servidor reintentable",
    async (fin) => {
      const cuerpo = conFin(await fixtureTexto(), fin);
      const { resultado } = await enviarCon(() => json(cuerpo));
      expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.SERVIDOR);
      expect(resultado.ok ? null : resultado.error.reintentable).toBe(true);
    },
  );

  test("length con tool_calls es fin limite y conserva las llamadas", async () => {
    const cuerpo = conFin(await fixtureHerramientas(), FINISH_REASON.LENGTH);
    const { resultado } = await enviarCon(() => json(cuerpo));
    expect(resultado.ok && resultado.respuesta.fin).toBe(FIN_LLM.LIMITE);
    expect(resultado.ok && resultado.respuesta.llamadas.map((llamada) => llamada.id)).toEqual([LLAMADA_ID]);
  });

  test("sin usage se estima el uso por caracteres para que el presupuesto muerda", async () => {
    const { usage: _omitido, ...cuerpo } = await fixtureTexto();
    const { resultado, pedidos } = await enviarCon(() => json(cuerpo));
    const [pedido] = pedidos;
    const contenido = resultado.ok ? (resultado.respuesta.texto ?? "") : "";
    expect(resultado.ok && resultado.respuesta.uso).toEqual({
      entrada: Math.ceil((pedido?.texto.length ?? 0) / CARACTERES_POR_TOKEN),
      salida: Math.ceil(contenido.length / CARACTERES_POR_TOKEN),
      cacheHit: 0,
    });
    expect(resultado.ok && resultado.respuesta.uso.entrada).toBeGreaterThan(0);
    expect(resultado.ok && resultado.respuesta.uso.salida).toBeGreaterThan(0);
  });

  test("sin usage la salida estimada cuenta los argumentos de las llamadas", async () => {
    const { usage: _omitido, ...cuerpo } = await fixtureHerramientas();
    const { resultado } = await enviarCon(() => json(cuerpo));
    const argumentos = resultado.ok ? resultado.respuesta.llamadas.map((llamada) => llamada.argumentos) : [];
    expect(resultado.ok && resultado.respuesta.uso.salida).toBe(
      Math.ceil(argumentos.join("").length / CARACTERES_POR_TOKEN),
    );
  });
});

describe("fallos de transporte", () => {
  test("un fetch que rechaza con TypeError es red", async () => {
    const { resultado } = await enviarCon(() => {
      throw new TypeError("fetch failed");
    });
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.RED);
  });

  test("una señal del llamador ya abortada es abortado y no llama a fetch", async () => {
    const falso = fetchFalso(() => json({}));
    const adaptador = createOpenAICompatibleAdapter(slotCon(), { fetch: falso.fetch });
    const resultado = await adaptador.enviar(MENSAJES, DEFINICIONES, opciones(false, AbortSignal.abort()));
    expect(tipoDeError(resultado)).toBe(TIPO_ERROR_LLM.ABORTADO);
    expect(falso.pedidos).toHaveLength(0);
  });
});

describe("el cuerpo sigue las capacidades del slot", () => {
  const texto = async (): Promise<Response> => json(await leerFixture(FIXTURE_TEXTO));

  test("max_completion_tokens reemplaza a max_tokens", async () => {
    const { pedidos } = await enviarCon(texto, {
      maxTokensParam: PARAMETRO_MAX_TOKENS.MAX_COMPLETION_TOKENS,
    });
    expect(pedidos[0]?.cuerpo[PARAMETRO_MAX_TOKENS.MAX_COMPLETION_TOKENS]).toBe(MAX_SALIDA);
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain(PARAMETRO_MAX_TOKENS.MAX_TOKENS);
  });

  test("temperature y thinking nulos se omiten", async () => {
    const { pedidos } = await enviarCon(texto, { temperature: null, thinking: null });
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("temperature");
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("thinking");
  });

  test("temperature y thinking presentes se envían", async () => {
    const { pedidos } = await enviarCon(texto, { temperature: 0, thinking: MODO_THINKING.DESHABILITADO });
    expect(pedidos[0]?.cuerpo.temperature).toBe(0);
    expect(pedidos[0]?.cuerpo.thinking).toEqual({ type: MODO_THINKING.DESHABILITADO });
  });

  test("herramientas desactivadas con toolChoiceNone envían tool_choice none", async () => {
    const { pedidos } = await enviarCon(texto, { toolChoiceNone: true }, MENSAJES, DEFINICIONES, true);
    expect(pedidos[0]?.cuerpo.tool_choice).toBe(TOOL_CHOICE.NINGUNA);
    expect(pedidos[0]?.cuerpo.tools).toHaveLength(DEFINICIONES.length);
  });

  test("herramientas desactivadas sin toolChoiceNone omiten tools y tool_choice", async () => {
    const { pedidos } = await enviarCon(texto, { toolChoiceNone: false }, MENSAJES, DEFINICIONES, true);
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("tools");
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("tool_choice");
  });

  test("herramientas activas envían tool_choice auto", async () => {
    const { pedidos } = await enviarCon(texto);
    expect(pedidos[0]?.cuerpo.tool_choice).toBe(TOOL_CHOICE.AUTO);
  });

  test("sin definiciones no hay clave tools", async () => {
    const { pedidos } = await enviarCon(texto, {}, MENSAJES, []);
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("tools");
    expect(Object.keys(pedidos[0]?.cuerpo ?? {})).not.toContain("tool_choice");
  });

  test.each([
    [true, "pienso leer la solicitud"],
    [false, undefined],
  ])("reasoningPassback %p controla reasoning_content", async (reasoningPassback, esperado) => {
    const { pedidos } = await enviarCon(texto, { reasoningPassback }, HISTORIAL_CON_RAZONAMIENTO);
    const mensajes = (pedidos[0]?.cuerpo.messages ?? []) as Record<string, unknown>[];
    const asistente = mensajes.find((mensaje) => mensaje.role === ROL_MENSAJE.ASISTENTE);
    expect(asistente?.reasoning_content).toBe(esperado);
  });

  test("la fuente del adaptador no nombra a ningún proveedor", async () => {
    expect(await Bun.file(FUENTE_ADAPTADOR).text()).not.toMatch(/deepseek/i);
  });
});
