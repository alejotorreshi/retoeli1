import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { crearFetchFalso, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  BINDINGS_PRUEBA,
  CODIGO_PRUEBA,
  crearServidorPrueba,
  SECRETO_PRUEBA,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { Hono } from "hono";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  CABECERA,
  NOMBRE_COOKIE_ACCESO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";

const CODIGO_ERRADO = "codigo-equivocado-0000";
const RESPUESTA_MODELO = "Listo, te escucho.";

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
