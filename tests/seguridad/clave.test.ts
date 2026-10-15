import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  BINDINGS_PRUEBA,
  CODIGO_PRUEBA,
  crearServidorPrueba,
  SECRETO_PRUEBA,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  CABECERA,
  CUERPO_MAXIMO_BYTES_POR_DEFECTO,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";

const RAIZ = join(import.meta.dir, "..", "..");

const CLAVE_DEEPSEEK_PRUEBA = "clave-deepseek-centinela-Wd4R";

const CENTINELAS = [CLAVE_PRUEBA, CLAVE_DEEPSEEK_PRUEBA, CODIGO_PRUEBA, SECRETO_PRUEBA];

const ENTORNO_CON_CENTINELAS = { DEEPSEEK_API_KEY: CLAVE_DEEPSEEK_PRUEBA };

const CASO = "co-industrias-delta";

const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];

const MARCA_SIN_SALDO = "turno-sin-saldo";

const SIN_SALDO: RespuestaGuion = { estado: 402, cuerpo: { error: { message: "Insufficient Balance" } } };

const TIEMPO_BUILD_MS = 120_000;

const TURNOS_SIMULTANEOS = 3;

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

function servidorCon(fetch: FetchLike): ServidorPrueba {
  return crearServidorPrueba({ raiz: proyecto.raiz, fetch, entorno: ENTORNO_CON_CENTINELAS });
}

function cuerpoChat(message: string, acepta: string = TIPO_CONTENIDO.SSE): RequestInit {
  return {
    method: "POST",
    headers: { [CABECERA.ACCEPT]: acepta },
    body: JSON.stringify({ sessionId: null, message }),
  };
}

function sinAcceso(servidor: ServidorPrueba, ruta: string, init: RequestInit = {}): Promise<Response> {
  return Promise.resolve(servidor.app.request(ruta, init, BINDINGS_PRUEBA));
}

async function volcado(respuesta: Response): Promise<string> {
  return `${respuesta.status}\n${JSON.stringify([...respuesta.headers.entries()])}\n${await respuesta.text()}`;
}

function centinelasEn(texto: string): string[] {
  return CENTINELAS.filter((centinela) => texto.includes(centinela));
}

function archivosDe(directorio: string): string[] {
  return [...new Bun.Glob("**/*").scanSync({ cwd: directorio, dot: true })];
}

describe("SEG-01: el bundle de la SPA", () => {
  let salida: string;

  beforeAll(async () => {
    salida = await mkdtemp(join(tmpdir(), "bundle-centinela-"));
  });

  afterAll(async () => {
    await rm(salida, { recursive: true, force: true });
  });

  test(
    "un build con las cuatro variables secretas en el entorno no deja ninguna en los archivos generados",
    async () => {
      const proceso = Bun.spawn(
        [
          process.execPath,
          "--no-env-file",
          "--bun",
          "vite",
          "build",
          "--config",
          "web/vite.config.ts",
          "--configLoader",
          "native",
          "--outDir",
          salida,
          "--emptyOutDir",
        ],
        {
          cwd: RAIZ,
          env: {
            PATH: process.env.PATH ?? "",
            HOME: process.env.HOME ?? tmpdir(),
            LLM_API_KEY: CLAVE_PRUEBA,
            DEEPSEEK_API_KEY: CLAVE_DEEPSEEK_PRUEBA,
            ACCESS_CODE: CODIGO_PRUEBA,
            ACCESS_TOKEN_SECRET: SECRETO_PRUEBA,
          },
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const registro = `${await new Response(proceso.stdout).text()}${await new Response(proceso.stderr).text()}`;
      expect({ salida: await proceso.exited, registro }).toMatchObject({ salida: 0 });
      const archivos = archivosDe(salida);
      expect(archivos).toContain("index.html");
      expect(archivos.some((archivo) => archivo.endsWith(".js"))).toBe(true);
      const fugas = await Promise.all(
        archivos.map(async (archivo) => ({
          archivo,
          centinelas: centinelasEn(await readFile(join(salida, archivo), "latin1")),
        })),
      );
      expect(fugas.filter((fuga) => fuga.centinelas.length > 0)).toEqual([]);
    },
    TIEMPO_BUILD_MS,
  );
});

describe("SEG-01: las respuestas de la API y el stream", () => {
  test("health, config, acceso, chat SSE, chat JSON, 401, 404 y 413 no llevan ningún centinela", async () => {
    const falso = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO } }) },
      { cuerpo: cuerpoConTexto("Leí la solicitud.") },
      { cuerpo: cuerpoConTexto("Respuesta en JSON.") },
    ]);
    const servidor = servidorCon(falso.fetch);
    const acceso = (codigo: string): RequestInit => ({ method: "POST", body: JSON.stringify({ codigo }) });

    const respuestas: Record<string, Response> = {
      salud: await sinAcceso(servidor, RUTA_API.SALUD),
      configuracion: await servidor.pedir(RUTA_API.CONFIG),
      accesoErrado: await sinAcceso(servidor, RUTA_API.ACCESO, {
        ...acceso(`${CODIGO_PRUEBA}-errado`),
        headers: { "Content-Type": TIPO_CONTENIDO.JSON },
      }),
      accesoValido: await sinAcceso(servidor, RUTA_API.ACCESO, {
        ...acceso(CODIGO_PRUEBA),
        headers: { "Content-Type": TIPO_CONTENIDO.JSON },
      }),
      chatSse: await servidor.pedir(RUTA_API.CHAT, cuerpoChat(`procesa el caso ${CASO}`)),
      chatJson: await servidor.pedir(RUTA_API.CHAT, cuerpoChat("hola", TIPO_CONTENIDO.JSON)),
      sinAcceso: await sinAcceso(servidor, RUTA_API.CHAT, {
        ...cuerpoChat("hola"),
        headers: { "Content-Type": TIPO_CONTENIDO.JSON },
      }),
      desconocida: await servidor.pedir(`${RUTA_API.SALUD}-desconocida`),
      cuerpoGrande: await servidor.pedir(RUTA_API.CHAT, {
        method: "POST",
        body: JSON.stringify({ sessionId: null, message: "x".repeat(CUERPO_MAXIMO_BYTES_POR_DEFECTO) }),
      }),
    };

    expect(Object.fromEntries(Object.entries(respuestas).map(([nombre, r]) => [nombre, r.status]))).toEqual({
      salud: RESPUESTA_HTTP.OK,
      configuracion: RESPUESTA_HTTP.OK,
      accesoErrado: RESPUESTA_HTTP.NO_AUTORIZADO,
      accesoValido: RESPUESTA_HTTP.SIN_CONTENIDO,
      chatSse: RESPUESTA_HTTP.OK,
      chatJson: RESPUESTA_HTTP.OK,
      sinAcceso: RESPUESTA_HTTP.NO_AUTORIZADO,
      desconocida: RESPUESTA_HTTP.NO_ENCONTRADO,
      cuerpoGrande: RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE,
    });
    const fugas = await Promise.all(
      Object.entries(respuestas).map(async ([nombre, r]) => ({
        nombre,
        centinelas: centinelasEn(await volcado(r)),
      })),
    );
    expect(fugas.filter((fuga) => fuga.centinelas.length > 0)).toEqual([]);
    expect(falso.pedidos.length).toBeGreaterThan(0);
    for (const pedido of falso.pedidos) expect(JSON.stringify(pedido.cabeceras)).toContain(CLAVE_PRUEBA);
  });

  test("un turno cuyo proveedor responde 402 no deja ningún centinela en el stream ni en las cabeceras", async () => {
    const falso = crearFetchFalso([SIN_SALDO]);
    const respuesta = await servidorCon(falso.fetch).pedir(RUTA_API.CHAT, cuerpoChat("hola"));
    const texto = await volcado(respuesta);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(texto).toContain(`event: ${TIPO_EVENTO.ERROR}`);
    expect(centinelasEn(texto)).toEqual([]);
    expect(falso.pedidos).toHaveLength(1);
  });
});

describe("SEG-01: turnos simultáneos", () => {
  test("tres turnos SSE a la vez, uno con 402 del proveedor, no filtran ningún centinela", async () => {
    let pedidos = 0;
    const fetch: FetchLike = async (_url, init) => {
      pedidos += 1;
      const sinSaldo = String(init.body).includes(MARCA_SIN_SALDO);
      const guion = sinSaldo ? SIN_SALDO : { cuerpo: cuerpoConTexto("Turno simultáneo.") };
      await Bun.sleep(5);
      return new Response(JSON.stringify(guion.cuerpo), {
        status: guion.estado ?? RESPUESTA_HTTP.OK,
        headers: { "Content-Type": TIPO_CONTENIDO.JSON },
      });
    };
    const servidor = servidorCon(fetch);
    const mensajes = Array.from({ length: TURNOS_SIMULTANEOS }, (_, indice) =>
      indice === 0 ? MARCA_SIN_SALDO : `turno simultáneo ${indice}`,
    );

    const respuestas = await Promise.all(
      mensajes.map((mensaje) => servidor.pedir(RUTA_API.CHAT, cuerpoChat(mensaje))),
    );
    const volcados = await Promise.all(respuestas.map(volcado));

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual(mensajes.map(() => RESPUESTA_HTTP.OK));
    expect(volcados.filter((texto) => texto.includes(`event: ${TIPO_EVENTO.ERROR}`))).toHaveLength(1);
    expect(volcados.every((texto) => texto.includes(`event: ${TIPO_EVENTO.FIN_TURNO}`))).toBe(true);
    expect(volcados.flatMap(centinelasEn)).toEqual([]);
    expect(pedidos).toBe(TURNOS_SIMULTANEOS);
  });
});

describe("SEG-01: el repositorio", () => {
  const envExample = Bun.file(join(RAIZ, ".env.example"));

  test("cada línea de .env.example es NOMBRE= sin valor", async () => {
    const lineas = (await envExample.text()).split("\n").filter((linea) => linea.trim() !== "");
    expect(lineas.length).toBeGreaterThan(0);
    expect(lineas.filter((linea) => !/^[A-Z][A-Z0-9_]*=$/.test(linea))).toEqual([]);
  });

  test("cada variable que lee config/env.ts está en .env.example y ninguna empieza con VITE_", async () => {
    const documentadas = new Set(
      (await envExample.text())
        .split("\n")
        .filter((linea) => linea.trim() !== "")
        .map((linea) => linea.slice(0, linea.indexOf("="))),
    );
    const fuente = await Bun.file(join(RAIZ, "src", "config", "env.ts")).text();
    const leidas = new Set([
      ...[...fuente.matchAll(/^\s+([A-Z][A-Z0-9_]*):/gm)].map((coincidencia) => coincidencia[1] ?? ""),
      ...[...fuente.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)].map(
        (coincidencia) => coincidencia[1] ?? "",
      ),
    ]);
    for (const nombre of [
      "LLM_API_KEY",
      "DEEPSEEK_API_KEY",
      "ACCESS_CODE",
      "ACCESS_TOKEN_SECRET",
      "FECHA_EJECUCION",
    ]) {
      expect(leidas.has(nombre)).toBe(true);
    }
    expect([...leidas].filter((nombre) => !documentadas.has(nombre))).toEqual([]);
    expect([...documentadas].filter((nombre) => nombre.startsWith("VITE_"))).toEqual([]);
  });

  test("la SPA no lee ninguna variable VITE_ del entorno", async () => {
    const fuentes = [...new Bun.Glob("web/src/**/*.{ts,tsx}").scanSync({ cwd: RAIZ }), "web/vite.config.ts"];
    const conVite = await Promise.all(
      fuentes.map(async (ruta) => ((await Bun.file(join(RAIZ, ruta)).text()).includes("VITE_") ? ruta : "")),
    );
    expect(fuentes.length).toBeGreaterThan(0);
    expect(conVite.filter((ruta) => ruta !== "")).toEqual([]);
  });
});
