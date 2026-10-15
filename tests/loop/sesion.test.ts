import { afterAll, afterEach, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import { recoger, sesionDe } from "@tests/helpers/eventos.helper.ts";
import {
  crearFetchFalso,
  cuerpoConHerramientas,
  cuerpoConTexto,
  diferido,
  esperarPedidos,
} from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { FetchFalso, MensajeWire, PedidoRegistrado } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import {
  CODIGO_AGENTE,
  DEADLINE_TURNO_MS_POR_DEFECTO,
  EVENTO_BITACORA,
  MARGEN_CANDADO_SESION_MS,
  MOTIVO_FIN,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { PRESET_DEEPSEEK, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
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
const PLAZO_POR_DEFECTO_MS = DEADLINE_TURNO_MS_POR_DEFECTO + MARGEN_CANDADO_SESION_MS;
const DEADLINE_CORTO_MS = 1_000;
const CASO = "co-industrias-delta";

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

function turnar(agente: Agente, mensaje: string, sesionId: string | null): Promise<EventoAgente[]> {
  return recoger(agente.turno({ sesionId, mensaje }));
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

function guionConHerramientaPendiente(...despues: readonly string[]): FetchFalso {
  return crearFetchFalso([
    {
      cuerpo: cuerpoConHerramientas({
        nombre: NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD],
        argumentos: { caso: CASO },
      }),
    },
    ...despues.map((texto) => ({ cuerpo: cuerpoConTexto(texto) })),
  ]);
}

function contenidosDe(pedido: PedidoRegistrado | undefined): readonly string[] {
  return mensajesDe(pedido).map((mensaje) => mensaje.content);
}

function enInstante(desplazamientoMs: number): void {
  setSystemTime(new Date(INSTANTE_BASE.getTime() + desplazamientoMs));
}

async function avanzarHasta(
  turno: AsyncGenerator<EventoAgente, void, undefined>,
  tipo: EventoAgente["tipo"],
): Promise<readonly EventoAgente[]> {
  const vistos: EventoAgente[] = [];
  for (;;) {
    const paso = await turno.next();
    if (paso.done) throw new Error(`el turno terminó antes de ${tipo}`);
    vistos.push(paso.value);
    if (paso.value.tipo === tipo) return vistos;
  }
}

function esOcupada(eventos: readonly EventoAgente[]): void {
  expect(tipos(eventos)).toEqual(["turn_start", "error", "turn_end"]);
  expect(eventos[1]).toMatchObject({ codigo: CODIGO_AGENTE.SESION_OCUPADA });
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
      { cuerpo: cuerpoConTexto("respuesta A"), demora: () => espera.promesa },
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

describe("un turno abandonado o vencido nunca bloquea ni pisa la sesión (AGT-04, WR-03)", () => {
  test("un consumidor que deja de iterar sin return() bloquea la sesión solo mientras dura el plazo", async () => {
    setSystemTime(INSTANTE_BASE);
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("respuesta A") },
      { cuerpo: cuerpoConTexto("respuesta B") },
      { cuerpo: cuerpoConTexto("respuesta C") },
    ]);
    const agente = agenteCon(fetch);
    const turnoA = agente.turno({ sesionId: null, mensaje: "turno A" });
    const vistosA = await avanzarHasta(turnoA, TIPO_EVENTO.TEXTO);
    const sesionId = sesionDe(vistosA);

    esOcupada(await turnar(agente, "turno B", sesionId));
    expect(pedidos).toHaveLength(1);

    enInstante(PLAZO_POR_DEFECTO_MS + 1);
    const turnoB = await turnar(agente, "turno B", sesionId);
    expect(tipos(turnoB)).toEqual(["turn_start", "usage", "text", "turn_end"]);
    expect(turnoB[0]).toMatchObject({ sesionId, sesionNueva: false, sesionExpirada: false });
    expect(contenidosDe(pedidos[1]).slice(2)).toEqual(["turno A", "respuesta A", "turno B"]);

    expect((await recoger(turnoA)).at(-1)).toMatchObject({ tipo: TIPO_EVENTO.FIN_TURNO });
    const turnoC = await turnar(agente, "turno C", sesionId);
    expect(turnoC.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    expect(contenidosDe(pedidos[2]).slice(2)).toEqual([
      "turno A",
      "respuesta A",
      "turno B",
      "respuesta B",
      "turno C",
    ]);
  });

  test("el plazo del candado sigue a AGENT_TURN_DEADLINE_MS", async () => {
    setSystemTime(INSTANTE_BASE);
    const { fetch, pedidos } = crearFetchFalso([
      { cuerpo: cuerpoConTexto("respuesta A") },
      { cuerpo: cuerpoConTexto("respuesta B") },
    ]);
    const agente = agenteCon(fetch, { AGENT_TURN_DEADLINE_MS: String(DEADLINE_CORTO_MS) });
    const turnoA = agente.turno({ sesionId: null, mensaje: "turno A" });
    const sesionId = sesionDe(await avanzarHasta(turnoA, TIPO_EVENTO.TEXTO));

    enInstante(DEADLINE_CORTO_MS + MARGEN_CANDADO_SESION_MS);
    esOcupada(await turnar(agente, "turno B", sesionId));
    expect(pedidos).toHaveLength(1);

    enInstante(DEADLINE_CORTO_MS + MARGEN_CANDADO_SESION_MS + 1);
    const turnoB = await turnar(agente, "turno B", sesionId);
    expect(turnoB[0]).toMatchObject({ sesionId, sesionNueva: false, sesionExpirada: false });
    expect(turnoB.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    await recoger(turnoA);
  });

  test("un titular vencido que se reanuda no libera ni pisa la sesión del nuevo titular", async () => {
    setSystemTime(INSTANTE_BASE);
    const espera = diferido();
    const { fetch, pedidos } = crearFetchFalso([
      {
        cuerpo: cuerpoConHerramientas({
          nombre: NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD],
          argumentos: { caso: CASO },
        }),
      },
      { cuerpo: cuerpoConTexto("respuesta B"), demora: () => espera.promesa },
      { cuerpo: cuerpoConTexto("respuesta A tarde") },
      { cuerpo: cuerpoConTexto("respuesta C") },
    ]);
    const agente = agenteCon(fetch);
    const turnoA = agente.turno({ sesionId: null, mensaje: "turno A" });
    const sesionId = sesionDe(await avanzarHasta(turnoA, TIPO_EVENTO.INICIO_HERRAMIENTA));

    enInstante(PLAZO_POR_DEFECTO_MS + 1);
    const restoB = turnar(agente, "turno B", sesionId);
    await esperarPedidos(pedidos, 2);
    expect(contenidosDe(pedidos[1]).slice(2)).toEqual(["turno B"]);

    const restoA = await recoger(turnoA);
    expect(tipos(restoA)).toEqual(["tool_end", "usage", "text", "turn_end"]);
    expect(restoA).toContainEqual(expect.objectContaining({ texto: "respuesta A tarde" }));
    expect(pedidos).toHaveLength(3);

    esOcupada(await turnar(agente, "turno C", sesionId));
    expect(pedidos).toHaveLength(3);

    espera.soltar();
    expect((await restoB).at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });

    const turnoC = await turnar(agente, "turno C", sesionId);
    expect(turnoC.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    const historial = contenidosDe(pedidos[3]);
    expect(historial.slice(2)).toEqual(["turno B", "respuesta B", "turno C"]);
    expect(historial).not.toContain("turno A");
    expect(historial).not.toContain("respuesta A tarde");
  });

  test("un titular vencido que termina después del nuevo titular no recupera su historial", async () => {
    setSystemTime(INSTANTE_BASE);
    const captura = capturarLogs();
    const { fetch, pedidos } = guionConHerramientaPendiente(
      "respuesta B",
      "respuesta A tarde",
      "respuesta C",
    );
    const creacion = crearAgente({
      directorio: proyecto.raiz,
      fetch,
      fuenteEntorno: { ...FUENTE, LOG_LEVEL: NIVELES_LOG.INFO },
      destinoLogs: captura.destino,
    });
    if (!creacion.ok) throw new Error(creacion.mensaje);
    const agente = creacion.agente;
    const turnoA = agente.turno({ sesionId: null, mensaje: "turno A" });
    const sesionId = sesionDe(await avanzarHasta(turnoA, TIPO_EVENTO.INICIO_HERRAMIENTA));

    enInstante(PLAZO_POR_DEFECTO_MS + 1);
    expect((await turnar(agente, "turno B", sesionId)).at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    expect((await recoger(turnoA)).at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });

    const turnoC = await turnar(agente, "turno C", sesionId);
    expect(turnoC.at(-1)).toMatchObject({ motivo: MOTIVO_FIN.FINAL });
    expect(contenidosDe(pedidos[3]).slice(2)).toEqual(["turno B", "respuesta B", "turno C"]);
    const fines = captura.lineas().filter((linea) => linea.msg === EVENTO_BITACORA.TURNO_FIN);
    expect(fines.map((linea) => linea.sesionGuardada)).toEqual([true, false, true]);
  });
});
