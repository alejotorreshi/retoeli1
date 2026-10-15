import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import type { AccionUi } from "@web/types/chat.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

const PEDIDO = { sessionId: null, message: "procesa el caso co-industrias-delta" } as const;
const TURNO = "turno-1";
const MENSAJE_MUY_LARGO = "El mensaje supera los 2000 caracteres. Acórtalo y vuelve a enviarlo.";

const inicio: SseEvent = {
  tipo: TIPO_EVENTO.INICIO_TURNO,
  sesionId: "sesion-de-prueba",
  turnoId: TURNO,
  sesionNueva: true,
  sesionExpirada: false,
};
const texto: SseEvent = { tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: "Hola" };
const fin: SseEvent = {
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
};

function marcos(eventos: readonly SseEvent[]): string {
  return eventos.map((evento) => `event: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`).join("");
}

function respuestaSse(cuerpo: string): Response {
  return new Response(cuerpo, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

function streamQueSeCorta(cuerpo: string): Response {
  const flujo = new ReadableStream<Uint8Array>({
    start(controlador) {
      controlador.enqueue(new TextEncoder().encode(cuerpo));
      controlador.error(new TypeError("conexión reiniciada"));
    },
  });
  return new Response(flujo, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

let restaurarFetch: (() => void) | null = null;

function simularFetch(responder: () => Promise<Response>) {
  const espia = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(responder, { preconnect: () => undefined }),
  );
  restaurarFetch = () => espia.mockRestore();
  return espia;
}

async function despachosDe(signal: AbortSignal = new AbortController().signal): Promise<AccionUi[]> {
  const acciones: AccionUi[] = [];
  await enviarMensaje(PEDIDO, (accion) => acciones.push(accion), signal);
  return acciones;
}

function tipos(acciones: readonly AccionUi[]): string[] {
  return acciones.map((accion) => accion.tipo);
}

afterEach(() => {
  restaurarFetch?.();
  restaurarFetch = null;
});

describe("enviarMensaje", () => {
  test("publica el mensaje como JSON en la ruta del chat", async () => {
    const espia = simularFetch(async () => respuestaSse(marcos([inicio, fin])));
    await despachosDe();
    const [url, init] = espia.mock.calls[0] ?? [];
    expect(url).toBe(RUTA_API.CHAT);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(PEDIDO);
  });

  test("un turno completo despacha sus eventos y no despacha FIN_STREAM", async () => {
    simularFetch(async () => respuestaSse(marcos([inicio, texto, fin])));
    const acciones = await despachosDe();
    expect(tipos(acciones)).toEqual([ACCION_UI.EVENTO, ACCION_UI.EVENTO, ACCION_UI.EVENTO]);
  });

  test("un stream que termina sin turn_end despacha FIN_STREAM", async () => {
    simularFetch(async () => respuestaSse(marcos([inicio, texto])));
    const acciones = await despachosDe();
    expect(tipos(acciones)).toEqual([ACCION_UI.EVENTO, ACCION_UI.EVENTO, ACCION_UI.FIN_STREAM]);
  });

  test("un stream que se corta con error despacha FIN_STREAM", async () => {
    simularFetch(async () => streamQueSeCorta(marcos([inicio])));
    const acciones = await despachosDe();
    expect(tipos(acciones).at(-1)).toBe(ACCION_UI.FIN_STREAM);
  });

  test("un rechazo HTTP con mensaje despacha ERROR_HTTP con su status y su mensaje", async () => {
    simularFetch(async () => Response.json({ mensaje: MENSAJE_MUY_LARGO }, { status: 413 }));
    const acciones = await despachosDe();
    expect(acciones).toEqual([{ tipo: ACCION_UI.ERROR_HTTP, status: 413, mensaje: MENSAJE_MUY_LARGO }]);
  });

  test("un 401 sin mensaje legible despacha ERROR_HTTP 401 con la copia de acceso vencido", async () => {
    simularFetch(async () => new Response("", { status: RESPUESTA_HTTP.NO_AUTORIZADO }));
    const acciones = await despachosDe();
    expect(acciones).toEqual([
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.NO_AUTORIZADO, mensaje: TEXTO_ACCESO.vencido },
    ]);
  });

  test("un rechazo HTTP sin mensaje legible despacha ERROR_RED", async () => {
    simularFetch(async () => new Response("Bad Gateway", { status: 502 }));
    const acciones = await despachosDe();
    expect(acciones).toEqual([{ tipo: ACCION_UI.ERROR_RED }]);
  });

  test("una falla de red despacha ERROR_RED", async () => {
    simularFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    const acciones = await despachosDe();
    expect(acciones).toEqual([{ tipo: ACCION_UI.ERROR_RED }]);
  });

  test("un pedido abortado por la pantalla no despacha nada", async () => {
    const controlador = new AbortController();
    controlador.abort();
    simularFetch(async () => {
      throw new DOMException("pedido abortado", "AbortError");
    });
    const acciones = await despachosDe(controlador.signal);
    expect(acciones).toEqual([]);
  });
});
