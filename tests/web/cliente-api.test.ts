import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { entrar, obtenerConfig } from "@web/api/cliente-api.ts";
import { RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import type { ConfigResponse } from "@/http/types/api.type.ts";

const CODIGO = "codigo-de-prueba-largo";
const CODIGO_INVALIDO = "El código no es válido. Revísalo y vuelve a intentarlo.";
const DEMASIADOS_INTENTOS = "Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentarlo.";
const CONFIG: ConfigResponse = {
  fechaEjecucion: "2026-09-03",
  zona: "America/Bogota",
  casos: ["co-industrias-delta"],
  presupuestoSesion: 300_000,
  mensajeMaximo: 2000,
};

let restaurarFetch: (() => void) | null = null;

function simularFetch(responder: () => Promise<Response>) {
  const espia = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(responder, { preconnect: () => undefined }),
  );
  restaurarFetch = () => espia.mockRestore();
  return espia;
}

afterEach(() => {
  restaurarFetch?.();
  restaurarFetch = null;
});

describe("obtenerConfig", () => {
  test("pide la ruta de config y devuelve la config del servidor", async () => {
    const espia = simularFetch(async () => Response.json(CONFIG));
    expect(await obtenerConfig()).toEqual({ tipo: RESULTADO_API.OK, valor: CONFIG });
    expect(espia.mock.calls[0]?.[0]).toBe(RUTA_API.CONFIG);
  });

  test("un 401 es acceso vencido con el mensaje del servidor", async () => {
    simularFetch(async () =>
      Response.json({ mensaje: TEXTO_ACCESO.vencido }, { status: RESPUESTA_HTTP.NO_AUTORIZADO }),
    );
    expect(await obtenerConfig()).toEqual({
      tipo: RESULTADO_API.ACCESO_VENCIDO,
      mensaje: TEXTO_ACCESO.vencido,
    });
  });

  test("un 401 sin cuerpo legible sigue siendo acceso vencido, con la copia del front", async () => {
    simularFetch(async () => new Response("", { status: RESPUESTA_HTTP.NO_AUTORIZADO }));
    expect(await obtenerConfig()).toEqual({
      tipo: RESULTADO_API.ACCESO_VENCIDO,
      mensaje: TEXTO_ACCESO.vencido,
    });
  });

  test("una config con otra forma no se acepta", async () => {
    simularFetch(async () => Response.json({ ...CONFIG, mensajeMaximo: "2000" }));
    expect(await obtenerConfig()).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });

  test("una falla de red devuelve sin red", async () => {
    simularFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await obtenerConfig()).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });
});

describe("entrar", () => {
  test("publica el código como JSON en la ruta de acceso y un 204 es éxito", async () => {
    const espia = simularFetch(async () => new Response(null, { status: RESPUESTA_HTTP.SIN_CONTENIDO }));
    expect(await entrar(CODIGO)).toEqual({ tipo: RESULTADO_API.OK, valor: null });
    const [url, init] = espia.mock.calls[0] ?? [];
    expect(url).toBe(RUTA_API.ACCESO);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ codigo: CODIGO });
  });

  test("un código incorrecto trae el mensaje del servidor", async () => {
    simularFetch(async () =>
      Response.json({ mensaje: CODIGO_INVALIDO }, { status: RESPUESTA_HTTP.NO_AUTORIZADO }),
    );
    expect(await entrar(CODIGO)).toEqual({ tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: CODIGO_INVALIDO });
  });

  test("un 429 trae el mensaje del servidor con su status", async () => {
    simularFetch(async () =>
      Response.json({ mensaje: DEMASIADOS_INTENTOS }, { status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS }),
    );
    expect(await entrar(CODIGO)).toEqual({
      tipo: RESULTADO_API.RECHAZO,
      status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
      mensaje: DEMASIADOS_INTENTOS,
    });
  });
});
