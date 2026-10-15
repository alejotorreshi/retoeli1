import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  BINDINGS_PRUEBA,
  CODIGO_PRUEBA,
  crearServidorPrueba,
  ENTORNO_SERVIDOR_PRUEBA,
  SECRETO_PRUEBA,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { Hono } from "hono";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  CABECERA,
  ENTORNO_APP,
  NOMBRE_COOKIE_ACCESO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
  RUTA_API,
  SEPARADOR_TOKEN,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_HTTP, TEXTO_ENV } from "@/config/strings.ts";
import type { HttpEnv, ServerCreation } from "@/http/types/server.type.ts";
import { createServer } from "@/http/wiring/server.wiring.ts";

const CODIGO_ERRADO = "codigo-equivocado-0000";
const RESPUESTA_MODELO = "Listo, te escucho.";
const AHORA = 1_790_000_000_000;
const VIGENCIA_MS = 43_200_000;
const VACIO = "";

type Armado = {
  readonly entorno?: Readonly<Record<string, string>>;
  readonly ahora?: () => number;
  readonly respuestas?: readonly RespuestaGuion[];
};

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

function appCon(respuestas: readonly RespuestaGuion[] = []): Hono<HttpEnv> {
  return crearServidorPrueba({ raiz: proyecto.raiz, fetch: crearFetchFalso(respuestas).fetch }).app;
}

function pedir(app: Hono<HttpEnv>, ruta: string, init: RequestInit = {}): Promise<Response> {
  return Promise.resolve(app.request(ruta, init, BINDINGS_PRUEBA));
}

function pedidoAcceso(codigo: string): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": TIPO_CONTENIDO.JSON },
    body: JSON.stringify({ codigo }),
  };
}

function pedidoChat(cabeceras: Record<string, string>, accept: string = TIPO_CONTENIDO.JSON): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": TIPO_CONTENIDO.JSON, [CABECERA.ACCEPT]: accept, ...cabeceras },
    body: JSON.stringify({ sessionId: null, message: "hola" }),
  };
}

function cookieEmitida(respuesta: Response): string {
  return (respuesta.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "";
}

function atributosDeCookie(respuesta: Response): string[] {
  return (respuesta.headers.get("Set-Cookie") ?? "").split(";").map((parte) => parte.trim());
}

async function entrar(app: Hono<HttpEnv>): Promise<string> {
  const respuesta = await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA));
  expect(respuesta.status).toBe(RESPUESTA_HTTP.SIN_CONTENIDO);
  return cookieEmitida(respuesta);
}

async function volcado(respuesta: Response): Promise<string> {
  return `${JSON.stringify([...respuesta.headers.entries()])}\n${await respuesta.text()}`;
}

describe("POST /api/acceso (D-72)", () => {
  test("un código errado responde 401 con el mensaje de código inválido y sin cookie", async () => {
    const respuesta = await pedir(appCon(), RUTA_API.ACCESO, pedidoAcceso(CODIGO_ERRADO));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.codigoInvalido });
    expect(respuesta.headers.get("Set-Cookie")).toBeNull();
  });

  test("un cuerpo con campos de más responde 400 sin cookie", async () => {
    const respuesta = await pedir(appCon(), RUTA_API.ACCESO, {
      method: "POST",
      headers: { "Content-Type": TIPO_CONTENIDO.JSON },
      body: JSON.stringify({ codigo: CODIGO_PRUEBA, extra: true }),
    });
    expect(respuesta.status).toBe(RESPUESTA_HTTP.PEDIDO_INVALIDO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.cuerpoAccesoInvalido });
    expect(respuesta.headers.get("Set-Cookie")).toBeNull();
  });

  test("el código correcto responde 204 con una cookie firmada HttpOnly, Strict, Path=/api y 12 h que no lleva el código", async () => {
    const respuesta = await pedir(appCon(), RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.SIN_CONTENIDO);
    const atributos = atributosDeCookie(respuesta);
    expect(atributos[0]).toStartWith(`${NOMBRE_COOKIE_ACCESO}=v1.`);
    expect(atributos).toContain("HttpOnly");
    expect(atributos).toContain("SameSite=Strict");
    expect(atributos).toContain("Path=/api");
    expect(atributos).toContain("Max-Age=43200");
    expect(atributos).toContain("Secure");
    expect(cookieEmitida(respuesta)).not.toContain(CODIGO_PRUEBA);
    expect(decodeURIComponent(cookieEmitida(respuesta))).not.toContain(CODIGO_PRUEBA);
  });

  test("esa cookie, sin Bearer, abre POST /api/chat", async () => {
    const app = appCon([{ cuerpo: cuerpoConTexto(RESPUESTA_MODELO) }]);
    const cookie = await entrar(app);
    const respuesta = await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.json()).toMatchObject({ reply: RESPUESTA_MODELO });
  });
});

describe("guardia de acceso sobre /api (D-72)", () => {
  test("sin acceso, /api/chat y una ruta /api desconocida responden 401 y health responde 200", async () => {
    const app = appCon();
    const chat = await pedir(app, RUTA_API.CHAT, pedidoChat({}));
    expect(chat.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
    expect(await chat.json()).toEqual({ mensaje: MENSAJE_HTTP.accesoVencido });
    const desconocida = await pedir(app, `${RUTA_API.CHAT}/no-existe`);
    expect(desconocida.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
    expect(await desconocida.json()).toEqual({ mensaje: MENSAJE_HTTP.accesoVencido });
    const salud = await pedir(app, RUTA_API.SALUD);
    expect(salud.status).toBe(RESPUESTA_HTTP.OK);
  });

  test("Authorization: Bearer con el código abre /api/chat y un Bearer errado no", async () => {
    const app = appCon([{ cuerpo: cuerpoConTexto(RESPUESTA_MODELO) }]);
    const errado = await pedir(
      app,
      RUTA_API.CHAT,
      pedidoChat({ [CABECERA.AUTORIZACION]: `${PREFIJO_BEARER}${CODIGO_ERRADO}` }),
    );
    expect(errado.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
    const correcto = await pedir(
      app,
      RUTA_API.CHAT,
      pedidoChat({ [CABECERA.AUTORIZACION]: `${PREFIJO_BEARER}${CODIGO_PRUEBA}` }),
    );
    expect(correcto.status).toBe(RESPUESTA_HTTP.OK);
  });

  test("el código y el secreto no salen en ningún body, cabecera ni frame SSE (SEG-01)", async () => {
    const eco = `Repito ${CODIGO_PRUEBA} y ${SECRETO_PRUEBA}.`;
    const app = appCon([{ cuerpo: cuerpoConTexto(eco) }, { cuerpo: cuerpoConTexto(eco) }]);
    const cookie = await entrar(app);
    const respuestas = [
      await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA)),
      await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_ERRADO)),
      await pedir(app, RUTA_API.SALUD),
      await pedir(app, RUTA_API.CHAT, pedidoChat({})),
      await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }, TIPO_CONTENIDO.SSE)),
      await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie })),
    ];
    const textos = await Promise.all(respuestas.map(volcado));
    expect(textos[4]).toContain("event:");
    for (const texto of textos) {
      expect(texto).not.toContain(CODIGO_PRUEBA);
      expect(texto).not.toContain(SECRETO_PRUEBA);
    }
  });
});

function crear(armado: Armado = {}): ServerCreation {
  return createServer({
    rootDirectory: proyecto.raiz,
    fetch: crearFetchFalso(armado.respuestas ?? []).fetch,
    envSource: { ...ENTORNO_SERVIDOR_PRUEBA, ...armado.entorno },
    wait: async () => undefined,
    ...(armado.ahora === undefined ? {} : { now: armado.ahora }),
  });
}

function appDe(creacion: ServerCreation): Hono<HttpEnv> {
  if (!creacion.ok) throw new Error(creacion.mensaje);
  return creacion.app;
}

function motivoDe(creacion: ServerCreation): string {
  expect(creacion.ok).toBe(false);
  return creacion.ok ? VACIO : creacion.mensaje;
}

function partesDeCookie(cookie: string): { readonly nombre: string; readonly partes: string[] } {
  const [nombre = VACIO, valor = VACIO] = cookie.split("=");
  return { nombre, partes: decodeURIComponent(valor).split(SEPARADOR_TOKEN) };
}

function cookieCon(nombre: string, partes: readonly string[]): string {
  return `${nombre}=${encodeURIComponent(partes.join(SEPARADOR_TOKEN))}`;
}

describe("cookies adulteradas o ajenas (D-72, T-03-10)", () => {
  test("una cookie con el vencimiento cambiado y la firma original responde 401", async () => {
    const app = appCon();
    const { nombre, partes } = partesDeCookie(await entrar(app));
    const [version = VACIO, vence = VACIO, firma = VACIO] = partes;
    const adulterada = cookieCon(nombre, [version, String(Number(vence) + VIGENCIA_MS), firma]);
    const respuesta = await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: adulterada }));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.accesoVencido });
  });

  test("una cookie sin firma responde 401 aunque su vencimiento sea futuro", async () => {
    const app = appCon();
    const sinFirma = cookieCon(NOMBRE_COOKIE_ACCESO, ["v1", String(Date.now() + VIGENCIA_MS)]);
    const respuesta = await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: sinFirma }));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
  });

  test("una cookie firmada con otro secreto responde 401", async () => {
    const ajena = appDe(crear({ entorno: { ACCESS_TOKEN_SECRET: `${SECRETO_PRUEBA}-otro` } }));
    const cookie = await entrar(ajena);
    const respuesta = await pedir(appCon(), RUTA_API.CHAT, pedidoChat({ Cookie: cookie }));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
  });
});

describe("vencimiento en milisegundos enteros del servidor (API-04)", () => {
  test("1 ms después del vencimiento responde 401, en el vencimiento también y 1 ms antes responde 200", async () => {
    let ahora = AHORA;
    const app = appDe(
      crear({ ahora: () => ahora, respuestas: [{ cuerpo: cuerpoConTexto(RESPUESTA_MODELO) }] }),
    );
    const cookie = await entrar(app);
    const vence = AHORA + VIGENCIA_MS;
    ahora = vence + 1;
    expect((await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(
      RESPUESTA_HTTP.NO_AUTORIZADO,
    );
    ahora = vence;
    expect((await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(
      RESPUESTA_HTTP.NO_AUTORIZADO,
    );
    ahora = vence - 1;
    expect((await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(RESPUESTA_HTTP.OK);
  });

  test("ACCESS_TOKEN_TTL_HOURS cambia el Max-Age y el vencimiento firmado", async () => {
    let ahora = AHORA;
    const app = appDe(crear({ entorno: { ACCESS_TOKEN_TTL_HOURS: "1" }, ahora: () => ahora }));
    const respuesta = await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA));
    expect(atributosDeCookie(respuesta)).toContain("Max-Age=3600");
    const cookie = cookieEmitida(respuesta);
    ahora = AHORA + 3_600_000;
    expect((await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(
      RESPUESTA_HTTP.NO_AUTORIZADO,
    );
  });
});

describe("configuración del acceso que falla cerrada (D-72)", () => {
  test("en producción sin ACCESS_TOKEN_SECRET el servidor no arranca y lo explica en español", () => {
    const motivo = motivoDe(
      crear({ entorno: { NODE_ENV: ENTORNO_APP.PRODUCCION, ACCESS_TOKEN_SECRET: VACIO } }),
    );
    expect(motivo).toContain("ACCESS_TOKEN_SECRET");
    expect(motivo).toContain(TEXTO_ENV.secretoTokenRequerido);
  });

  test("en producción sin ACCESS_CODE el servidor no arranca y lo explica en español", () => {
    const motivo = motivoDe(crear({ entorno: { NODE_ENV: ENTORNO_APP.PRODUCCION, ACCESS_CODE: VACIO } }));
    expect(motivo).toContain("ACCESS_CODE");
    expect(motivo).toContain(TEXTO_ENV.codigoAccesoRequerido);
  });

  test("sin NODE_ENV rige producción y exige el secreto", () => {
    const motivo = motivoDe(crear({ entorno: { NODE_ENV: VACIO, ACCESS_TOKEN_SECRET: VACIO } }));
    expect(motivo).toContain("ACCESS_TOKEN_SECRET");
  });

  test("un ACCESS_CODE más corto que el mínimo no arma el servidor", () => {
    const motivo = motivoDe(crear({ entorno: { ACCESS_CODE: "corto" } }));
    expect(motivo).toContain(TEXTO_ENV.codigoAccesoCorto);
  });

  test("un ACCESS_TOKEN_SECRET igual al código de acceso no arma el servidor", () => {
    const motivo = motivoDe(
      crear({ entorno: { NODE_ENV: ENTORNO_APP.PRODUCCION, ACCESS_CODE: SECRETO_PRUEBA } }),
    );
    expect(motivo).toContain("ACCESS_TOKEN_SECRET");
  });

  test("un ACCESS_TOKEN_SECRET igual a la clave del modelo no arma el servidor", () => {
    const motivo = motivoDe(
      crear({ entorno: { NODE_ENV: ENTORNO_APP.PRODUCCION, LLM_API_KEY: SECRETO_PRUEBA } }),
    );
    expect(motivo).toContain("ACCESS_TOKEN_SECRET");
    expect(motivo).not.toContain(SECRETO_PRUEBA);
  });

  test("en producción la cookie lleva Secure", async () => {
    const app = appDe(crear({ entorno: { NODE_ENV: ENTORNO_APP.PRODUCCION } }));
    const respuesta = await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA));
    expect(atributosDeCookie(respuesta)).toContain("Secure");
  });

  test("en desarrollo sin secreto arranca con uno efímero propio y la cookie va sin Secure", async () => {
    const desarrollo = { NODE_ENV: ENTORNO_APP.DESARROLLO, ACCESS_TOKEN_SECRET: VACIO };
    const app = appDe(
      crear({ entorno: desarrollo, respuestas: [{ cuerpo: cuerpoConTexto(RESPUESTA_MODELO) }] }),
    );
    const respuesta = await pedir(app, RUTA_API.ACCESO, pedidoAcceso(CODIGO_PRUEBA));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.SIN_CONTENIDO);
    expect(atributosDeCookie(respuesta)).not.toContain("Secure");
    const cookie = cookieEmitida(respuesta);
    expect((await pedir(app, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(RESPUESTA_HTTP.OK);
    const otra = appDe(crear({ entorno: desarrollo }));
    expect((await pedir(otra, RUTA_API.CHAT, pedidoChat({ Cookie: cookie }))).status).toBe(
      RESPUESTA_HTTP.NO_AUTORIZADO,
    );
  });
});
