import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { BINDINGS_PRUEBA, cabecerasPrueba, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { PedidoRegistrado } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  ARCHIVO_INDEX_WEB,
  CABECERA,
  DIRECTORIO_WEB_DIST,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";

const MAXIMO_CARACTERES = 2000;
const MAXIMO_BYTES = 16_384;
const MENSAJE_LARGO_2000 = "El mensaje supera los 2000 caracteres. Acórtalo y vuelve a enviarlo.";
const INDEX_HTML = '<!doctype html><html lang="es"><body><div id="root"></div></body></html>';
const RESPUESTA_MODELO = "Listo, te escucho.";
const CABECERA_CSP = "Content-Security-Policy";
const CABECERA_NOSNIFF = "X-Content-Type-Options";
const CABECERA_HSTS = "Strict-Transport-Security";
const DIRECTIVAS_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
];
const ESPACIO = " ";
const TEXTO_PLANO = "text/plain";
const CODIFICADOR = new TextEncoder();

let proyecto: ProyectoTemporal;
let directorioWeb: string;
let restaurarFecha: () => void;

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  directorioWeb = join(proyecto.raiz, DIRECTORIO_WEB_DIST);
  await mkdir(directorioWeb, { recursive: true });
  await writeFile(join(directorioWeb, ARCHIVO_INDEX_WEB), INDEX_HTML);
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

type Armado = {
  readonly servidor: ServidorPrueba;
  readonly pedidos: readonly PedidoRegistrado[];
};

function armar(entorno: Readonly<Record<string, string>> = {}): Armado {
  const falso = crearFetchFalso([{ cuerpo: cuerpoConTexto(RESPUESTA_MODELO) }]);
  const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno, directorioWeb });
  return { servidor, pedidos: falso.pedidos };
}

function cuerpoDeBytes(bytes: number, message = "hola"): string {
  const base = JSON.stringify({ sessionId: null, message });
  return `${base}${ESPACIO.repeat(bytes - CODIFICADOR.encode(base).length)}`;
}

function chatJson(body: BodyInit, cabeceras: Record<string, string> = {}): RequestInit {
  return { method: "POST", headers: { [CABECERA.ACCEPT]: TIPO_CONTENIDO.JSON, ...cabeceras }, body };
}

function chatSinTipo(body: string): Promise<Response> {
  const cabeceras = cabecerasPrueba();
  cabeceras.delete("Content-Type");
  return Promise.resolve(armar().servidor.app.request(RUTA_API.CHAT, { method: "POST", headers: cabeceras, body }, BINDINGS_PRUEBA));
}

function flujoDe(texto: string): ReadableStream<Uint8Array> {
  const bytes = CODIFICADOR.encode(texto);
  return new ReadableStream({
    start(controlador) {
      controlador.enqueue(bytes);
      controlador.close();
    },
  });
}

function expectCabecerasDeSeguridad(respuesta: Response): void {
  const csp = respuesta.headers.get(CABECERA_CSP) ?? "";
  for (const directiva of DIRECTIVAS_CSP) expect(csp).toContain(directiva);
  expect(respuesta.headers.get(CABECERA_NOSNIFF)).toBe("nosniff");
  expect(respuesta.headers.get(CABECERA_HSTS)).not.toBeNull();
}

describe("solo JSON en los POST de /api (415)", () => {
  test("POST /api/chat con text/plain responde 415 y no empieza un turno", async () => {
    const { servidor, pedidos } = armar();
    const respuesta = await servidor.pedir(
      RUTA_API.CHAT,
      chatJson(cuerpoDeBytes(100), { "Content-Type": TEXTO_PLANO }),
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.TIPO_NO_SOPORTADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.tipoNoSoportado });
    expect(pedidos).toHaveLength(0);
  });

  test("POST /api/chat sin Content-Type responde 415", async () => {
    const respuesta = await chatSinTipo(cuerpoDeBytes(100));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.TIPO_NO_SOPORTADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.tipoNoSoportado });
  });

  test("POST /api/acceso con text/plain responde 415 sin evaluar el código", async () => {
    const { servidor } = armar();
    const respuesta = await servidor.app.request(
      RUTA_API.ACCESO,
      { method: "POST", headers: { "Content-Type": TEXTO_PLANO }, body: JSON.stringify({ codigo: "x" }) },
      BINDINGS_PRUEBA,
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.TIPO_NO_SOPORTADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.tipoNoSoportado });
  });

  test("application/json con charset pasa el filtro", async () => {
    const { servidor, pedidos } = armar();
    const respuesta = await servidor.pedir(
      RUTA_API.CHAT,
      chatJson(cuerpoDeBytes(100), { "Content-Type": `${TIPO_CONTENIDO.JSON}; charset=utf-8` }),
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(1);
  });
});

describe("límite del cuerpo antes de parsear (413)", () => {
  test("un cuerpo de 16384 bytes pasa el límite y empieza el turno", async () => {
    const { servidor, pedidos } = armar();
    const cuerpo = cuerpoDeBytes(MAXIMO_BYTES);
    expect(CODIFICADOR.encode(cuerpo).length).toBe(MAXIMO_BYTES);
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpo));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(1);
  });

  test("un cuerpo de 16385 bytes responde 413 y no empieza el turno", async () => {
    const { servidor, pedidos } = armar();
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpoDeBytes(MAXIMO_BYTES + 1)));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.cuerpoDemasiadoGrande });
    expect(pedidos).toHaveLength(0);
  });

  test("un cuerpo de 16385 bytes que no es JSON responde 413, no 400: se corta antes de parsear", async () => {
    const { servidor } = armar();
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson("{".repeat(MAXIMO_BYTES + 1)));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
  });

  test("un cuerpo de 16385 bytes en stream, sin Content-Length, también responde 413", async () => {
    const { servidor } = armar();
    const init: RequestInit = { ...chatJson(flujoDe(cuerpoDeBytes(MAXIMO_BYTES + 1))), duplex: "half" };
    const respuesta = await servidor.pedir(RUTA_API.CHAT, init);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
  });

  test("POST /api/acceso con un cuerpo de 16385 bytes responde 413", async () => {
    const { servidor } = armar();
    const respuesta = await servidor.app.request(
      RUTA_API.ACCESO,
      { method: "POST", headers: { "Content-Type": TIPO_CONTENIDO.JSON }, body: ESPACIO.repeat(MAXIMO_BYTES + 1) },
      BINDINGS_PRUEBA,
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
  });

  test("MAX_BODY_BYTES configura el límite", async () => {
    const { servidor } = armar({ MAX_BODY_BYTES: "200" });
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpoDeBytes(201)));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
  });
});

describe("largo máximo del mensaje (413)", () => {
  test("un mensaje de exactamente 2000 caracteres empieza un turno", async () => {
    const { servidor, pedidos } = armar();
    const cuerpo = JSON.stringify({ sessionId: null, message: "a".repeat(MAXIMO_CARACTERES) });
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpo));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(pedidos).toHaveLength(1);
  });

  test("un mensaje de 2001 caracteres responde 413 con el texto de UI-SPEC y no llama al proveedor", async () => {
    const { servidor, pedidos } = armar();
    const cuerpo = JSON.stringify({ sessionId: null, message: "a".repeat(MAXIMO_CARACTERES + 1) });
    const respuesta = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpo));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_LARGO_2000 });
    expect(pedidos).toHaveLength(0);
  });

  test("MAX_MESSAGE_CHARS configura el máximo y el texto lo nombra", async () => {
    const { servidor, pedidos } = armar({ MAX_MESSAGE_CHARS: "10" });
    const respuesta = await servidor.pedir(
      RUTA_API.CHAT,
      chatJson(JSON.stringify({ sessionId: null, message: "a".repeat(11) })),
    );
    expect(respuesta.status).toBe(RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_LARGO_2000.replace("2000", "10") });
    expect(pedidos).toHaveLength(0);
  });

  test("GET /api/config incluye mensajeMaximo", async () => {
    const porDefecto = await armar().servidor.pedir(RUTA_API.CONFIG);
    expect(await porDefecto.json()).toMatchObject({ mensajeMaximo: MAXIMO_CARACTERES });
    const configurado = await armar({ MAX_MESSAGE_CHARS: "1500" }).servidor.pedir(RUTA_API.CONFIG);
    expect(await configurado.json()).toMatchObject({ mensajeMaximo: 1500 });
  });
});

describe("cabeceras de seguridad en toda respuesta", () => {
  test("GET /api/health trae la CSP estricta, nosniff y HSTS", async () => {
    const respuesta = await armar().servidor.app.request(RUTA_API.SALUD, {}, BINDINGS_PRUEBA);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expectCabecerasDeSeguridad(respuesta);
  });

  test("GET / de la SPA trae la CSP estricta, nosniff y HSTS", async () => {
    const respuesta = await armar().servidor.app.request("/", {}, BINDINGS_PRUEBA);
    expect(await respuesta.text()).toBe(INDEX_HTML);
    expectCabecerasDeSeguridad(respuesta);
  });

  test("los errores 415 y 413 también traen la CSP", async () => {
    const { servidor } = armar();
    const tipo = await servidor.pedir(RUTA_API.CHAT, chatJson("{}", { "Content-Type": TEXTO_PLANO }));
    const grande = await servidor.pedir(RUTA_API.CHAT, chatJson(cuerpoDeBytes(MAXIMO_BYTES + 1)));
    expectCabecerasDeSeguridad(tipo);
    expectCabecerasDeSeguridad(grande);
  });
});
