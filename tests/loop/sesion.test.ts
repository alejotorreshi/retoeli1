import { afterAll, afterEach, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import {
  crearFetchFalso,
  cuerpoConTexto,
  diferido,
  esperarPedidos,
} from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { MensajeWire, PedidoRegistrado } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { PRESET_DEEPSEEK, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE, TEXTO_CONTEXTO, TEXTO_ENV, TEXTO_SESION } from "@/config/strings.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

const CLAVE = "clave-de-prueba-Zq9X";
const MARCA_CLAVE = "Zq9X";
const FUENTE = { LLM_API_KEY: CLAVE, LOG_LEVEL: "silent" };
const INSTANTE_BASE = new Date("2026-09-03T15:00:00.000Z");
const DOS_MINUTOS_MS = 2 * 60_000;

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

afterEach(() => {
  setSystemTime();
});

function agenteCon(fetch: FetchLike, extra: Readonly<Record<string, string>> = {}): Agente {
  const creacion = crearAgente({ directorio: proyecto.raiz, fetch, fuenteEntorno: { ...FUENTE, ...extra } });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  return creacion.agente;
}

async function recoger(eventos: AsyncIterable<EventoAgente>): Promise<EventoAgente[]> {
  const recogidos: EventoAgente[] = [];
  for await (const evento of eventos) recogidos.push(evento);
  return recogidos;
}

function turnar(agente: Agente, mensaje: string, sesionId: string | null): Promise<EventoAgente[]> {
  return recoger(agente.turno({ sesionId, mensaje }));
}

function sesionDe(eventos: readonly EventoAgente[]): string {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
  return inicio.sesionId;
}

function sesionDeEvento(evento: EventoAgente | undefined): string {
  return sesionDe(evento === undefined ? [] : [evento]);
}

function mensajesDe(pedido: PedidoRegistrado | undefined): readonly MensajeWire[] {
  if (pedido === undefined) throw new Error("pedido ausente");
  return pedido.cuerpo.messages;
}

function tipos(eventos: readonly EventoAgente[]): string[] {
  return eventos.map((evento) => evento.tipo);
}

describe("crearAgente compone el agente desde el entorno (LLM-01)", () => {
  test("con clave devuelve el agente con su proveedor y modelo, sin llamar a la red", () => {
    const { fetch, pedidos } = crearFetchFalso([]);
    const creacion = crearAgente({ directorio: proyecto.raiz, fetch, fuenteEntorno: FUENTE });
    expect(creacion.ok).toBe(true);
    if (!creacion.ok) return;
    expect(creacion.agente.proveedor).toBe(PROVEEDOR_DEEPSEEK);
    expect(creacion.agente.modelo).toBe(PRESET_DEEPSEEK.model);
    expect(pedidos).toHaveLength(0);
  });

  test("sin clave devuelve PROVEEDOR_SIN_CLAVE con el mensaje del catálogo", () => {
    const { fetch } = crearFetchFalso([]);
    expect(crearAgente({ directorio: proyecto.raiz, fetch, fuenteEntorno: {} })).toEqual({
      ok: false,
      codigo: CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE,
      mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE],
    });
  });

  test("una configuración inválida devuelve CONFIGURACION_LLM_INVALIDA sin la clave", () => {
    const { fetch } = crearFetchFalso([]);
    const creacion = crearAgente({
      directorio: proyecto.raiz,
      fetch,
      fuenteEntorno: { ...FUENTE, LLM_BASE_URL: "http://api.example.com" },
    });
    expect(creacion.ok).toBe(false);
    if (creacion.ok) return;
    expect(creacion.codigo).toBe(CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA);
    expect(creacion.mensaje).toContain(MENSAJE_AGENTE[CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA]);
    expect(creacion.mensaje).toContain(TEXTO_ENV.urlNoSegura);
    expect(creacion.mensaje).not.toContain(MARCA_CLAVE);
  });
});

describe("cada turno lleva la fecha efectiva en su propio mensaje de sistema (D-57)", () => {
  test("messages[1] es la fecha y el prefijo messages[0] es idéntico entre turnos", async () => {
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("uno") },
      { cuerpo: cuerpoConTexto("dos") },
    ]);
    const agente = agenteCon(fetch);
    const primero = await turnar(agente, "hola", null);
    const sesionId = sesionDe(primero);
    await turnar(agente, "otra vez", sesionId);

    const [prefijo, fecha] = mensajesDe(pedidos[0]);
    expect(fecha).toEqual({ role: "system", content: TEXTO_CONTEXTO.fecha(FECHA_DEMO) });
    expect(prefijo?.role).toBe("system");
    expect(mensajesDe(pedidos[1])[0]?.content).toBe(prefijo?.content ?? "");
    expect(mensajesDe(pedidos[1])[1]?.content).toBe(TEXTO_CONTEXTO.fecha(FECHA_DEMO));
    expect(prefijo?.content).not.toContain(FECHA_DEMO);
    expect(prefijo?.content).not.toContain(sesionId);
  });
});

describe("sesiones perdidas y expiradas (D-58)", () => {
  test("una sesión nueva no lleva aviso", async () => {
    const { fetch } = crearFetchFalso([{ cuerpo: cuerpoConTexto("hola") }]);
    const eventos = await turnar(agenteCon(fetch), "hola", null);
    expect(eventos[0]).toMatchObject({ sesionNueva: true, sesionExpirada: false });
    expect(tipos(eventos)).toEqual(["turn_start", "usage", "text", "turn_end"]);
  });

  test("un id desconocido o mal formado abre otra sesión y avisa que expiró", async () => {
    for (const perdido of ["sesion-perdida", "../fuera"]) {
      const { fetch, pedidos } = crearFetchFalso([{ cuerpo: cuerpoConTexto("hola") }]);
      const eventos = await turnar(agenteCon(fetch), "hola", perdido);
      expect(eventos[0]).toMatchObject({ sesionNueva: true, sesionExpirada: true });
      expect(sesionDe(eventos)).not.toBe(perdido);
      expect(eventos[1]).toMatchObject({ tipo: TIPO_EVENTO.TEXTO, texto: TEXTO_SESION.expirada });
      expect(mensajesDe(pedidos[0]).map((mensaje) => mensaje.role)).toEqual(["system", "system", "user"]);
    }
  });

  test("tras el TTL de inactividad la sesión vieja ya no existe", async () => {
    setSystemTime(INSTANTE_BASE);
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("uno") },
      { cuerpo: cuerpoConTexto("dos") },
    ]);
    const agente = agenteCon(fetch, { AGENT_SESSION_TTL_MINUTES: "1" });
    const sesionId = sesionDe(await turnar(agente, "hola", null));

    setSystemTime(new Date(INSTANTE_BASE.getTime() + DOS_MINUTOS_MS));
    const eventos = await turnar(agente, "sigo aquí", sesionId);
    expect(sesionDe(eventos)).not.toBe(sesionId);
    expect(eventos[0]).toMatchObject({ sesionNueva: true, sesionExpirada: true });
    expect(eventos[1]).toMatchObject({ tipo: TIPO_EVENTO.TEXTO, texto: TEXTO_SESION.expirada });
    expect(mensajesDe(pedidos[1]).map((mensaje) => mensaje.content)).not.toContain("hola");
  });
});

describe("dos turnos nunca se intercalan sobre una sesión (AGT-04)", () => {
  test("un segundo turno en vuelo recibe SESION_OCUPADA y no toca el historial", async () => {
    const espera = diferido();
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("respuesta A"), demora: espera.promesa },
      { cuerpo: cuerpoConTexto("respuesta C") },
    ]);
    const agente = agenteCon(fetch);
    const turnoA = agente.turno({ sesionId: null, mensaje: "turno A" });
    const inicioA = await turnoA.next();
    const sesionId = sesionDeEvento(inicioA.done ? undefined : inicioA.value);
    const restoA = recoger(turnoA);
    await esperarPedidos(pedidos, 1);

    const turnoB = await turnar(agente, "turno B", sesionId);
    expect(tipos(turnoB)).toEqual(["turn_start", "error", "turn_end"]);
    expect(sesionDe(turnoB)).toBe(sesionId);
    expect(turnoB[1]).toMatchObject({
      codigo: CODIGO_AGENTE.SESION_OCUPADA,
      mensaje: MENSAJE_AGENTE[CODIGO_AGENTE.SESION_OCUPADA],
    });
    expect(turnoB[2]).toMatchObject({ motivo: MOTIVO_FIN.ERROR });
    expect(pedidos).toHaveLength(1);

    espera.soltar();
    expect((await restoA).at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });

    const turnoC = await turnar(agente, "turno C", sesionId);
    expect(turnoC.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    const historial = mensajesDe(pedidos[1]);
    expect(historial.map((mensaje) => mensaje.role)).toEqual([
      "system",
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(historial.slice(2).map((mensaje) => mensaje.content)).toEqual([
      "turno A",
      "respuesta A",
      "turno C",
    ]);
  });

  test("abandonar el generador libera la sesión y el siguiente turno funciona", async () => {
    const { fetch, pedidos } = crearFetchFalso([{ cuerpo: cuerpoConTexto("sigo") }]);
    const agente = agenteCon(fetch);
    const abandonado = agente.turno({ sesionId: null, mensaje: "me voy" });
    const inicio = await abandonado.next();
    const sesionId = sesionDeEvento(inicio.done ? undefined : inicio.value);
    await abandonado.return(undefined);

    const siguiente = await turnar(agente, "volví", sesionId);
    expect(siguiente[0]).toMatchObject({ sesionId, sesionNueva: false, sesionExpirada: false });
    expect(tipos(siguiente)).toEqual(["turn_start", "usage", "text", "turn_end"]);
    expect(pedidos).toHaveLength(1);
  });
});
