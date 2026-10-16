import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { mapearProyectado } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { CODIGO_PRUEBA, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import { ejecutarPreflight } from "@/cli/runners/preflight.runner.ts";
import { archivosGuionSchema } from "@/cli/schemas/preflight.schema.ts";
import type {
  FetchPreflight,
  OpcionesPreflight,
  PlazosPreflight,
  ResultadoPreflight,
} from "@/cli/types/preflight.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import {
  CABECERA,
  DIRECTIVA_SIN_CACHE,
  LONGITUD_MINIMA_CODIGO_ACCESO,
  METODO_POST,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM, PRESET_DEEPSEEK, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { CASO_GUION_PRD } from "@/config/constants/preflight.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { parsePreflightEnv, pinExecutionDate } from "@/config/env.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const RUNNER = join(RAIZ, "src", "cli", "runners", "preflight.runner.ts");
const CODIGO_AJENO = "codigo-ajeno-Zq8L-0000";
const CODIGO_CORTO = "corto-Q1";
const VALOR_SECRETO_EN_ARGV = "secreto-en-argv-Xw4P-9876";
const METODO_GET = "GET";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const RUTA_ARCHIVOS_GUION = `/api/casos/${CASO_GUION_PRD}/archivos`;

const PLAZOS_PRUEBA: PlazosPreflight = {
  despertarMs: 30_000,
  sondeoMs: 10_000,
  pausaMs: 1_000,
  turnoMs: 30_000,
  separacionSseMs: 0,
};

const DEMORA_LLM_MS = 80;

const SEPARACION_SSE_PRUEBA_MS = 50;

const PLAZOS_CON_SEPARACION: PlazosPreflight = {
  ...PLAZOS_PRUEBA,
  separacionSseMs: SEPARACION_SSE_PRUEBA_MS,
};

const relojReal = () => performance.now();

type PedidoVisto = { readonly metodo: string; readonly ruta: string; readonly cuerpo: string | null };

type ArmarGuion = (raiz: string) => Promise<readonly RespuestaGuion[]>;

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
  armarGuion: ArmarGuion = async () => [],
): Promise<URL> {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso(await armarGuion(proyecto.raiz));
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
    const cuerpo = typeof init?.body === "string" ? init.body : null;
    pedidos.push({ metodo: init?.method ?? METODO_GET, ruta: url.pathname, cuerpo });
    return base(url, init);
  };
}

async function correr(
  url: URL,
  extra: Partial<Pick<OpcionesPreflight, "codigo" | "guion" | "plazos" | "ahora">> & {
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
    ahora: extra.ahora ?? (() => reloj),
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

async function mapeoProyectado(raiz: string) {
  return mapearProyectado(
    crearHerramientas(),
    { directory: raiz, sessionId: "preparacion-preflight" },
    CASO_GUION_PRD,
  );
}

function guionPrd({
  conPaquete,
  demoraMs = 0,
}: {
  readonly conPaquete: boolean;
  readonly demoraMs?: number;
}): ArmarGuion {
  return async (raiz) => {
    const mapeo = await mapeoProyectado(raiz);
    const caso = { caso: CASO_GUION_PRD };
    const demorar = demoraMs > 0 ? { demora: () => Bun.sleep(demoraMs) } : {};
    const respuestas: RespuestaGuion[] = [
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: caso }) },
      { cuerpo: cuerpoConHerramientas({ nombre: MAPEAR, argumentos: { ...caso, campos: [] } }) },
      { cuerpo: cuerpoConHerramientas({ nombre: GENERAR, argumentos: { ...caso, mapeo } }) },
      ...(conPaquete ? [{ cuerpo: cuerpoConHerramientas({ nombre: ARMAR, argumentos: caso }) }] : []),
      { cuerpo: cuerpoConTexto(`Procesé ${CASO_GUION_PRD}. ¿Confirmas el envío simulado?`) },
      { cuerpo: cuerpoConHerramientas({ nombre: SIMULAR, argumentos: caso }) },
      { cuerpo: cuerpoConTexto("Envío simulado registrado.") },
    ];
    return respuestas.map((respuesta) => ({ ...respuesta, ...demorar }));
  };
}

function registrarArchivos(listas: string[][]): FetchPreflight {
  return async (url, init) => {
    const respuesta = await fetch(url, init);
    if (url.pathname === RUTA_ARCHIVOS_GUION) {
      const lista = archivosGuionSchema.parse(await respuesta.clone().json());
      listas.push(lista.archivos.map(({ nombre }) => nombre));
    }
    return respuesta;
  };
}

function reescribirChat(transformar: (respuesta: Response) => Promise<Response>): FetchPreflight {
  return async (url, init) => {
    const respuesta = await fetch(url, init);
    return url.pathname === RUTA_API.CHAT ? transformar(respuesta) : respuesta;
  };
}

function conCabeceras(ajustar: (cabeceras: Headers) => void): FetchPreflight {
  return reescribirChat(async (respuesta) => {
    const cabeceras = new Headers(respuesta.headers);
    ajustar(cabeceras);
    return new Response(respuesta.body, { status: respuesta.status, headers: cabeceras });
  });
}

const comoElBordeDeRender = conCabeceras((cabeceras) => {
  cabeceras.delete(CABECERA.X_ACCEL_BUFFERING);
  cabeceras.set(CABECERA.CACHE_CONTROL, DIRECTIVA_SIN_CACHE);
});

const sinCacheControl = conCabeceras((cabeceras) => cabeceras.delete(CABECERA.CACHE_CONTROL));

const acumulandoElSse = reescribirChat(async (respuesta) => {
  const bytes = await respuesta.arrayBuffer();
  return new Response(bytes, { status: respuesta.status, headers: respuesta.headers });
});

function turnosDelChat(pedidos: readonly PedidoVisto[]): { sessionId: string | null; message: string }[] {
  return pedidosA(pedidos, RUTA_API.CHAT).map((pedido) => JSON.parse(pedido.cuerpo ?? "null"));
}

describe("pre-flight con --guion: PRD §11 en dos turnos SSE (D-92)", () => {
  test("corre el guion completo en una sola sesión y reporta los tokens", async () => {
    const url = await servir({}, guionPrd({ conPaquete: true }));
    const listas: string[][] = [];
    const { resultado, lineas, pedidos } = await correr(url, {
      guion: true,
      envolver: registrarArchivos(listas),
    });
    expect(resultado.fallido).toBe(false);
    const tokens = resultado.tokens;
    expect(tokens).not.toBeNull();
    if (tokens === null) throw new Error("faltan los tokens del guion");
    expect(tokens.entrada).toBeGreaterThan(0);
    expect(lineas).toContain(
      TEXTO_PREFLIGHT.tokens(tokens.entrada, tokens.cacheHit, tokens.salida, tokens.totalSesion),
    );
    expect(lineas).toContain(TEXTO_PREFLIGHT.turnoOk(1));
    expect(lineas).toContain(TEXTO_PREFLIGHT.turnoOk(2));
    expect(lineas.at(-1)).toBe(TEXTO_PREFLIGHT.resultadoOk);
    expect(listas).toHaveLength(2);
    expect(listas[0]).not.toContain(ARCHIVOS_SALIDA.ENVIO_SIMULADO);
    expect(listas[1]).toContain(ARCHIVOS_SALIDA.ENVIO_SIMULADO);
    const turnos = turnosDelChat(pedidos);
    expect(turnos.map(({ message }) => message)).toEqual([
      TEXTO_PREFLIGHT.mensajeGuion,
      TEXTO_PREFLIGHT.mensajeConfirmacion,
    ]);
    expect(turnos[0]?.sessionId).toBeNull();
    expect(turnos[1]?.sessionId).toEqual(expect.any(String));
  });

  test("si el turno 1 no deja la confirmación pendiente falla y nunca manda el segundo turno", async () => {
    const url = await servir({}, guionPrd({ conPaquete: false }));
    const { resultado, lineas, pedidos } = await correr(url, { guion: true });
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.sinConfirmacion(CASO_GUION_PRD));
    expect(turnosDelChat(pedidos)).toHaveLength(1);
  });

  test("sin X-Accel-Buffering y con Cache-Control no-cache, como llega por el borde de Render, pasa si el SSE llega por partes", async () => {
    const url = await servir({}, guionPrd({ conPaquete: true, demoraMs: DEMORA_LLM_MS }));
    const { resultado, lineas, pedidos } = await correr(url, {
      guion: true,
      envolver: comoElBordeDeRender,
      plazos: PLAZOS_CON_SEPARACION,
      ahora: relojReal,
    });
    expect(lineas).not.toContain(TEXTO_PREFLIGHT.cabeceraSse(CABECERA.X_ACCEL_BUFFERING));
    expect(resultado.fallido).toBe(false);
    expect(lineas.at(-1)).toBe(TEXTO_PREFLIGHT.resultadoOk);
    expect(turnosDelChat(pedidos)).toHaveLength(2);
  });

  test("si el SSE llega sin Cache-Control no-cache, falla nombrando la cabecera", async () => {
    const url = await servir({}, guionPrd({ conPaquete: true }));
    const { resultado, lineas, pedidos } = await correr(url, { guion: true, envolver: sinCacheControl });
    expect(resultado.fallido).toBe(true);
    expect(lineas).toContain(TEXTO_PREFLIGHT.cabeceraSse(CABECERA.CACHE_CONTROL));
    expect(turnosDelChat(pedidos)).toHaveLength(1);
  });

  test("si un proxy acumula el SSE y turn_end llega junto con turn_start, falla con sseAcumulado", async () => {
    const url = await servir({}, guionPrd({ conPaquete: true, demoraMs: DEMORA_LLM_MS }));
    const { resultado, lineas, pedidos } = await correr(url, {
      guion: true,
      envolver: acumulandoElSse,
      plazos: PLAZOS_CON_SEPARACION,
      ahora: relojReal,
    });
    expect(resultado.fallido).toBe(true);
    const acumulados = Array.from({ length: SEPARACION_SSE_PRUEBA_MS }, (_, ms) =>
      TEXTO_PREFLIGHT.sseAcumulado(ms),
    );
    expect(lineas.some((linea) => acumulados.includes(linea))).toBe(true);
    expect(turnosDelChat(pedidos)).toHaveLength(1);
  });

  test("el mensaje del guion es el del chip de la SPA (mensajeDemo) y la confirmación es envía", () => {
    expect(TEXTO_PREFLIGHT.mensajeGuion).toBe(TEXTO_ACCIONES.mensajeDemo);
    expect(TEXTO_PREFLIGHT.mensajeConfirmacion).toBe("envía");
  });
});
