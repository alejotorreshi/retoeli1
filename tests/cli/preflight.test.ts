import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { CODIGO_PRUEBA, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import { ejecutarPreflight } from "@/cli/runners/preflight.runner.ts";
import type {
  FetchPreflight,
  OpcionesPreflight,
  PlazosPreflight,
  ResultadoPreflight,
} from "@/cli/types/preflight.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  LONGITUD_MINIMA_CODIGO_ACCESO,
  METODO_POST,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM, PRESET_DEEPSEEK, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { parsePreflightEnv, pinExecutionDate } from "@/config/env.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const RUNNER = join(RAIZ, "src", "cli", "runners", "preflight.runner.ts");
const CODIGO_AJENO = "codigo-ajeno-Zq8L-0000";
const CODIGO_CORTO = "corto-Q1";
const VALOR_SECRETO_EN_ARGV = "secreto-en-argv-Xw4P-9876";
const METODO_GET = "GET";

const PLAZOS_PRUEBA: PlazosPreflight = {
  despertarMs: 30_000,
  sondeoMs: 10_000,
  pausaMs: 1_000,
  turnoMs: 30_000,
};

type PedidoVisto = { readonly metodo: string; readonly ruta: string };

type Corrida = {
  readonly resultado: ResultadoPreflight;
  readonly lineas: readonly string[];
  readonly pedidos: readonly PedidoVisto[];
};

const limpiezas: (() => unknown)[] = [];
let restaurarFecha: () => void;

beforeAll(() => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
});

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servir(
  entorno: Readonly<Record<string, string>> = {},
  guion: readonly RespuestaGuion[] = [],
): Promise<URL> {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso(guion);
  const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno });
  const real = Bun.serve({ port: 0, fetch: servidor.app.fetch });
  limpiezas.push(() => real.stop(true));
  return new URL(real.url);
}

function servirSiempre(estado: number): URL {
  const real = Bun.serve({ port: 0, fetch: () => new Response(null, { status: estado }) });
  limpiezas.push(() => real.stop(true));
  return new URL(real.url);
}

function contarPedidos(pedidos: PedidoVisto[], base: FetchPreflight = fetch): FetchPreflight {
  return async (url, init) => {
    pedidos.push({ metodo: init?.method ?? METODO_GET, ruta: url.pathname });
    return base(url, init);
  };
}

async function correr(
  url: URL,
  extra: Partial<Pick<OpcionesPreflight, "codigo" | "guion" | "plazos">> & {
    readonly envolver?: FetchPreflight;
  } = {},
): Promise<Corrida> {
  const lineas: string[] = [];
  const pedidos: PedidoVisto[] = [];
  let reloj = 0;
  const resultado = await ejecutarPreflight({
    url,
    codigo: extra.codigo ?? CODIGO_PRUEBA,
    guion: extra.guion ?? false,
    fetch: contarPedidos(pedidos, extra.envolver),
    plazos: extra.plazos ?? PLAZOS_PRUEBA,
    escribir: (linea) => lineas.push(linea),
    esperar: async (ms) => {
      reloj += ms;
    },
    ahora: () => reloj,
  });
  expect(lineas.filter((linea) => linea.includes(extra.codigo ?? CODIGO_PRUEBA))).toEqual([]);
  return { resultado, lineas, pedidos };
}

function pedidosA(pedidos: readonly PedidoVisto[], ruta: string): PedidoVisto[] {
  return pedidos.filter((pedido) => pedido.ruta === ruta);
}

describe("pre-flight por defecto contra un socket real de la app (D-92, D-97)", () => {
  test("despierta el servicio, valida la salud y el código, y nunca abre un turno del chat", async () => {
    const url = await servir();
    const { resultado, lineas, pedidos } = await correr(url);
    expect(resultado).toEqual({ fallido: false, tokens: null });
    expect(lineas).toContain(TEXTO_PREFLIGHT.saludLista(PROVEEDOR_DEEPSEEK, PRESET_DEEPSEEK.model, 0));
    expect(lineas).toContain(TEXTO_PREFLIGHT.accesoOk(FECHA_DEMO, 4));
    expect(lineas.at(-1)).toBe(TEXTO_PREFLIGHT.resultadoOk);
    expect(pedidosA(pedidos, RUTA_API.CONFIG)).toHaveLength(1);
    expect(pedidos.filter((pedido) => pedido.metodo === METODO_POST)).toEqual([]);
    expect(pedidosA(pedidos, RUTA_API.CHAT)).toEqual([]);
  });

  test("un código rechazado falla con codigoRechazado y pide la configuración una sola vez", async () => {
    const url = await servir({ ACCESS_CODE: CODIGO_AJENO });
    const { resultado, lineas, pedidos } = await correr(url);
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.codigoRechazado);
    expect(pedidosA(pedidos, RUTA_API.CONFIG)).toHaveLength(1);
  });

  test("una IP bloqueada falla con ipBloqueada sin reintentar", async () => {
    const url = await servir({ ACCESS_CODE: CODIGO_AJENO, ACCESS_MAX_FAILED_ATTEMPTS: "1" });
    await correr(url);
    const { resultado, lineas, pedidos } = await correr(url);
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.ipBloqueada);
    expect(pedidosA(pedidos, RUTA_API.CONFIG)).toHaveLength(1);
  });

  test("sin clave del modelo falla nombrando el estado y nunca prueba el código", async () => {
    const url = await servir({ LLM_API_KEY: "" });
    const { resultado, lineas, pedidos } = await correr(url);
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.modeloNoDisponible(ESTADO_LLM.SIN_CLAVE));
    expect(pedidosA(pedidos, RUTA_API.CONFIG)).toEqual([]);
  });

  test("una fecha de ejecución distinta de la del guion falla con fechaInesperada", async () => {
    const restaurar = pinExecutionDate("2026-09-15");
    try {
      const url = await servir();
      const { resultado, lineas } = await correr(url);
      expect(resultado.fallido).toBe(true);
      expect(lineas).toContain(TEXTO_PREFLIGHT.fechaInesperada("2026-09-15"));
    } finally {
      restaurar();
    }
  });

  test("un servicio que nunca responde 200 falla con servicioDormido al vencer el plazo", async () => {
    const url = servirSiempre(RESPUESTA_HTTP.NO_DISPONIBLE);
    const plazos = { ...PLAZOS_PRUEBA, despertarMs: 3_000, pausaMs: 1_000 };
    const { resultado, lineas, pedidos } = await correr(url, { plazos });
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.servicioDormido(3));
    expect(pedidosA(pedidos, RUTA_API.SALUD).length).toBeGreaterThan(1);
    expect(pedidosA(pedidos, RUTA_API.SALUD).length).toBeLessThanOrEqual(4);
    expect(pedidosA(pedidos, RUTA_API.CONFIG)).toEqual([]);
  });

  test("un servicio que no escucha también agota el plazo sin lanzar", async () => {
    const real = Bun.serve({ port: 0, fetch: () => new Response(null) });
    const url = new URL(real.url);
    real.stop(true);
    const plazos = { ...PLAZOS_PRUEBA, despertarMs: 2_000, pausaMs: 1_000 };
    const { resultado, lineas } = await correr(url, { plazos });
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.servicioDormido(2));
  });
});

describe("entorno del pre-flight (D-92)", () => {
  function errores(fuente: Readonly<Record<string, string>>): string {
    const lectura = parsePreflightEnv(fuente);
    expect(lectura.success).toBe(false);
    return JSON.stringify(lectura.error?.issues ?? []);
  }

  test("sin PREFLIGHT_ACCESS_CODE falla nombrando la variable", () => {
    const lectura = parsePreflightEnv({});
    expect(lectura.success).toBe(false);
    expect(lectura.error?.issues.map((issue) => issue.path.join("."))).toContain("PREFLIGHT_ACCESS_CODE");
  });

  test(`un código de menos de ${LONGITUD_MINIMA_CODIGO_ACCESO} caracteres falla sin repetir el valor`, () => {
    expect(errores({ PREFLIGHT_ACCESS_CODE: CODIGO_CORTO })).not.toContain(CODIGO_CORTO);
  });

  test("la URL, si viene, es https o http solo hacia un host local", () => {
    errores({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: "ftp://registro.example.com" });
    errores({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: "http://registro.example.com" });
    errores({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: "no es una url" });
    for (const url of ["https://registro.example.com", "http://localhost:3998"]) {
      const lectura = parsePreflightEnv({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: url });
      expect(lectura.data).toEqual({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: url });
    }
  });

  test("sin PREFLIGHT_URL el entorno es válido y la URL queda sin definir", () => {
    const lectura = parsePreflightEnv({ PREFLIGHT_ACCESS_CODE: ` ${CODIGO_PRUEBA} `, PREFLIGHT_URL: "" });
    expect(lectura.data).toEqual({ PREFLIGHT_ACCESS_CODE: CODIGO_PRUEBA, PREFLIGHT_URL: undefined });
  });
});

describe("la entrada del comando nunca acepta el código como argumento (T-04-10)", () => {
  async function ejecutarComando(argumentos: readonly string[]) {
    const proceso = Bun.spawn(["bun", RUNNER, ...argumentos], {
      cwd: RAIZ,
      env: { PATH: process.env.PATH ?? "" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const salida = `${await new Response(proceso.stdout).text()}${await new Response(proceso.stderr).text()}`;
    return { codigo: await proceso.exited, salida };
  }

  test("una opción desconocida con el código sale con 1 y no lo imprime", async () => {
    const { codigo, salida } = await ejecutarComando(["--codigo", VALOR_SECRETO_EN_ARGV]);
    expect(codigo).toBe(1);
    expect(salida).toContain(TEXTO_PREFLIGHT.uso);
    expect(salida).not.toContain(VALOR_SECRETO_EN_ARGV);
  });

  test("un argumento suelto sale con 1 y no lo imprime", async () => {
    const { codigo, salida } = await ejecutarComando([VALOR_SECRETO_EN_ARGV]);
    expect(codigo).toBe(1);
    expect(salida).not.toContain(VALOR_SECRETO_EN_ARGV);
  });
});
