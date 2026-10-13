import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { confirmaciones, finDeTurno, finesDeHerramienta, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { historialIntegro } from "@tests/helpers/historial.helper.ts";
import {
  llamar,
  pasoGenerarConMapeo,
  respuestaHerramientas,
  respuestaTexto,
} from "@tests/helpers/llm-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { PasoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { MOTIVO_FIN, SEPARADOR_PARRAFOS, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { cierreDeterminista } from "@/domain/builders/cierre-turno.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { RespuestaLlm } from "@/llm/types/llm.type.ts";
import type { EventoAgente, EventoUso } from "@/loop/types/evento.type.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const AGOTADO = MENSAJE_AGENTE.PRESUPUESTO_AGOTADO;

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;

beforeAll(() => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
});

beforeEach(async () => {
  proyecto = await crearProyectoTemporal();
});

afterEach(async () => {
  await proyecto.limpiar();
});

function gastando(respuesta: RespuestaLlm, entrada: number, salida: number): RespuestaLlm {
  return { ...respuesta, uso: { entrada, salida, cacheHit: 0 } };
}

function agente(guion: readonly PasoLlmFalso[], presupuestoTokens: number): AgentePrueba {
  return crearAgentePrueba({ raiz: proyecto.raiz, guion, presupuestoTokens });
}

function usos(eventos: readonly EventoAgente[]): EventoUso[] {
  return eventos.filter((evento): evento is EventoUso => evento.tipo === TIPO_EVENTO.USO);
}

function errores(eventos: readonly EventoAgente[]): EventoAgente[] {
  return eventos.filter((evento) => evento.tipo === TIPO_EVENTO.ERROR);
}

function resumidas(
  eventos: readonly EventoAgente[],
  caso: string,
  herramientas: readonly ValorDe<typeof HERRAMIENTA>[],
): LlamadaResumida[] {
  return herramientas.flatMap((herramienta) =>
    finesDeHerramienta(eventos, NOMBRE_VISIBLE[herramienta]).map((fin) => ({
      herramienta,
      caso,
      ok: fin.ok,
      resumen: fin.resumen,
    })),
  );
}

function historialSano(prueba: AgentePrueba): void {
  expect(prueba.llm.pedidos.length).toBeGreaterThan(0);
  for (const pedido of prueba.llm.pedidos) expect(historialIntegro(pedido.mensajes)).toEqual([]);
}

describe("presupuesto de tokens por sesión (LLM-05, D-51)", () => {
  test("a mitad de turno cierra con tope_tokens, lo completado y lo que falta, sin evento de error", async () => {
    const prueba = agente(
      [
        gastando(respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: CO })), 400, 200),
        gastando(
          respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: CO, campos: [] })),
          400,
          200,
        ),
        respuestaTexto("no debería llegar"),
      ],
      1000,
    );
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    expect(prueba.llm.pedidos).toHaveLength(2);
    expect(usos(eventos).map((uso) => uso.totalSesion)).toEqual([600, 1200]);
    expect(errores(eventos)).toEqual([]);
    expect(finDeTurno(eventos)).toMatchObject({ motivo: MOTIVO_FIN.TOPE_TOKENS, needsConfirmation: false });
    const llamadas = resumidas(eventos, CO, [HERRAMIENTA.LEER_SOLICITUD, HERRAMIENTA.MAPEAR_CAMPOS]);
    expect(llamadas.every((llamada) => llamada.ok)).toBe(true);
    const texto = textoFinal(eventos);
    expect(texto).toBe(`${AGOTADO}${SEPARADOR_PARRAFOS}${cierreDeterminista(llamadas)}`);
    expect(texto).toContain("Completé");
    expect(texto).toContain("Falta");
    historialSano(prueba);
  });

  test("un turno posterior responde de inmediato con el mensaje de presupuesto y no llama al proveedor", async () => {
    const prueba = agente(
      [gastando(respuestaTexto("Hola, ¿qué caso proceso?"), 900, 200), respuestaTexto("no debería llegar")],
      1000,
    );
    await prueba.turno("hola");
    expect(prueba.llm.pedidos).toHaveLength(1);

    const siguiente = await prueba.turno(`Procesa el caso ${CO}`);
    expect(prueba.llm.pedidos).toHaveLength(1);
    expect(siguiente.map((evento) => evento.tipo)).toEqual([
      TIPO_EVENTO.INICIO_TURNO,
      TIPO_EVENTO.TEXTO,
      TIPO_EVENTO.FIN_TURNO,
    ]);
    expect(textoFinal(siguiente)).toBe(AGOTADO);
    expect(finDeTurno(siguiente)).toMatchObject({ motivo: MOTIVO_FIN.TOPE_TOKENS, needsConfirmation: false });

    const otraVez = await prueba.turno("¿sigues ahí?");
    expect(prueba.llm.pedidos).toHaveLength(1);
    expect(textoFinal(otraVez)).toBe(AGOTADO);
    historialSano(prueba);
  });

  test("los eventos usage acumulan totalSesion entre turnos", async () => {
    const prueba = agente(
      [
        respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: CO })),
        respuestaTexto("Leí la solicitud."),
        respuestaTexto("De nada."),
      ],
      1000,
    );
    const primero = await prueba.turno(`Lee el caso ${CO}`);
    const segundo = await prueba.turno("gracias");

    expect(usos(primero).map((uso) => uso.totalSesion)).toEqual([15, 30]);
    expect(usos(segundo).map((uso) => uso.totalSesion)).toEqual([45]);
    expect(finDeTurno(segundo).motivo).toBe(MOTIVO_FIN.FINAL);
    historialSano(prueba);
  });

  test("un turno que arma ec y agota el presupuesto termina con la pregunta de confirmación (D-63.2)", async () => {
    const prueba = agente(
      [
        respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
        respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
        pasoGenerarConMapeo(EC),
        gastando(respuestaHerramientas(llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })), 800, 200),
        respuestaTexto("no debería llegar"),
      ],
      1000,
    );
    const eventos = await prueba.turno(`Procesa el caso ${EC}`);

    expect(prueba.llm.pedidos).toHaveLength(4);
    expect(errores(eventos)).toEqual([]);
    expect(finDeTurno(eventos)).toMatchObject({ motivo: MOTIVO_FIN.TOPE_TOKENS, needsConfirmation: true });
    expect(confirmaciones(eventos)).toEqual([expect.objectContaining({ caso: EC })]);
    const texto = textoFinal(eventos);
    expect(texto.startsWith(AGOTADO)).toBe(true);
    expect(texto).toContain("Completé");
    expect(texto.trimEnd().endsWith("?")).toBe(true);
    expect(texto.slice(texto.lastIndexOf(SEPARADOR_PARRAFOS))).toContain(EC);
    historialSano(prueba);
  });
});
