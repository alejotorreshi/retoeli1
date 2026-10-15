import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { entrar, obtenerConfig, obtenerSalud, obtenerSesionAsentada } from "@web/api/cliente-api.ts";
import { RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ConfigResponse, HealthResponse, SessionViewResponse } from "@/http/types/api.type.ts";

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

const SALUD: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.TOPE_DIARIO,
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

describe("obtenerSalud", () => {
  test("pide la ruta pública de health sin cuerpo ni método POST y devuelve el estado del modelo", async () => {
    const espia = simularFetch(async () => Response.json(SALUD));
    expect(await obtenerSalud()).toEqual({ tipo: RESULTADO_API.OK, valor: SALUD });
    const [url, init] = espia.mock.calls[0] ?? [];
    expect(url).toBe(RUTA_API.SALUD);
    expect(init?.method).toBeUndefined();
    expect(init?.body).toBeUndefined();
  });

  test("acepta cada estado del modelo que el servidor puede reportar", async () => {
    for (const llm of Object.values(ESTADO_LLM)) {
      simularFetch(async () => Response.json({ ...SALUD, llm }));
      expect(await obtenerSalud()).toEqual({ tipo: RESULTADO_API.OK, valor: { ...SALUD, llm } });
      restaurarFetch?.();
    }
  });

  test("un estado del modelo desconocido o una forma distinta no se aceptan", async () => {
    simularFetch(async () => Response.json({ ...SALUD, llm: "caido" }));
    expect(await obtenerSalud()).toEqual({ tipo: RESULTADO_API.SIN_RED });
    restaurarFetch?.();
    simularFetch(async () => Response.json({ ...SALUD, ok: false }));
    expect(await obtenerSalud()).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });

  test("una falla de red devuelve sin red", async () => {
    simularFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await obtenerSalud()).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });
});

describe("obtenerSesionAsentada (Detener y Recargar conversación)", () => {
  const VISTA: SessionViewResponse = {
    sesionId: "sesion-de-prueba",
    turnos: [],
    pendientes: [],
    casosEnviados: [],
    tokensUsados: 12_345,
    ocupada: false,
  };

  test("una vista libre se usa tal cual, con un solo pedido", async () => {
    const espia = simularFetch(async () => Response.json(VISTA));
    expect(await obtenerSesionAsentada(VISTA.sesionId)).toEqual({ tipo: RESULTADO_API.OK, valor: VISTA });
    expect(espia.mock.calls).toHaveLength(1);
  });

  test("una vista ocupada se pide una sola vez más, después de la espera", async () => {
    let pedidos = 0;
    const espia = simularFetch(async () => {
      pedidos += 1;
      return Response.json({ ...VISTA, ocupada: pedidos === 1 });
    });
    expect(await obtenerSesionAsentada(VISTA.sesionId)).toEqual({ tipo: RESULTADO_API.OK, valor: VISTA });
    expect(espia.mock.calls).toHaveLength(2);
  });

  test("si sigue ocupada después del reintento, devuelve esa vista sin un tercer pedido", async () => {
    const espia = simularFetch(async () => Response.json({ ...VISTA, ocupada: true }));
    expect(await obtenerSesionAsentada(VISTA.sesionId)).toEqual({
      tipo: RESULTADO_API.OK,
      valor: { ...VISTA, ocupada: true },
    });
    expect(espia.mock.calls).toHaveLength(2);
  });

  test("abortar durante la espera no repite el pedido", async () => {
    const controlador = new AbortController();
    const espia = simularFetch(async () => {
      controlador.abort();
      return Response.json({ ...VISTA, ocupada: true });
    });
    await obtenerSesionAsentada(VISTA.sesionId, controlador.signal);
    expect(espia.mock.calls).toHaveLength(1);
  });

  test("una vista sin el uso de tokens o sin la marca de ocupada no se acepta", async () => {
    const { ocupada: _ocupada, ...sinOcupada } = VISTA;
    simularFetch(async () => Response.json(sinOcupada));
    expect(await obtenerSesionAsentada(VISTA.sesionId)).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });
});
