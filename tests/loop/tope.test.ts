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
import type { PasoLlmFalso, PedidoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { MOTIVO_FIN, SEPARADOR_PARRAFOS, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ROL_MENSAJE, TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_CIERRE } from "@/config/strings.ts";
import { cierreDeterminista } from "@/domain/builders/cierre-turno.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { ErrorLlm, RespuestaLlm } from "@/llm/types/llm.type.ts";
import type { EventoAgente, EventoUso } from "@/loop/types/evento.type.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const MAX_ITERACIONES = 3;
const RESUMEN_MODELO = "Leí la solicitud de co-industrias-delta. Falta mapear los campos.";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const ERROR_SERVIDOR: ErrorLlm = {
  tipo: TIPO_ERROR_LLM.SERVIDOR,
  reintentable: true,
  estado: 500,
  reintentarTrasMs: null,
};

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

function leerCo(id: string): RespuestaLlm {
  return respuestaHerramientas(llamar(id, HERRAMIENTA.LEER_SOLICITUD, { caso: CO }));
}

function gastando(respuesta: RespuestaLlm, entrada: number, salida: number): RespuestaLlm {
  return { ...respuesta, uso: { entrada, salida, cacheHit: 0 } };
}

const TRES_LECTURAS: readonly PasoLlmFalso[] = [leerCo("leer-1"), leerCo("leer-2"), leerCo("leer-3")];

function agente(guion: readonly PasoLlmFalso[], presupuestoTokens?: number): AgentePrueba {
  return crearAgentePrueba({
    raiz: proyecto.raiz,
    guion,
    maxIteraciones: MAX_ITERACIONES,
    ...(presupuestoTokens === undefined ? {} : { presupuestoTokens }),
  });
}

function usos(eventos: readonly EventoAgente[]): EventoUso[] {
  return eventos.filter((evento): evento is EventoUso => evento.tipo === TIPO_EVENTO.USO);
}

function errores(eventos: readonly EventoAgente[]): EventoAgente[] {
  return eventos.filter((evento) => evento.tipo === TIPO_EVENTO.ERROR);
}

function contieneInstruccionTope(pedido: PedidoLlmFalso): boolean {
  return pedido.mensajes.some(
    (mensaje) => mensaje.rol === ROL_MENSAJE.SISTEMA && mensaje.contenido === TEXTO_CIERRE.instruccionTope,
  );
}

function lecturasResumidas(eventos: readonly EventoAgente[]): LlamadaResumida[] {
  return finesDeHerramienta(eventos, LEER).map((fin) => ({
    herramienta: HERRAMIENTA.LEER_SOLICITUD,
    caso: CO,
    ok: fin.ok,
    resumen: fin.resumen,
  }));
}

function historialSano(prueba: AgentePrueba): void {
  expect(prueba.llm.pedidos.length).toBeGreaterThan(0);
  for (const pedido of prueba.llm.pedidos) expect(historialIntegro(pedido.mensajes)).toEqual([]);
}

function esperarCierreDeterminista(eventos: readonly EventoAgente[]): void {
  const llamadas = lecturasResumidas(eventos);
  expect(llamadas).toHaveLength(MAX_ITERACIONES);
  const [primera] = llamadas;
  const texto = textoFinal(eventos);
  expect(texto).toBe(cierreDeterminista(llamadas));
  expect(texto).toContain(primera?.resumen ?? "falta el resumen de leer");
  expect(texto).toContain("Falta");
  expect(errores(eventos)).toEqual([]);
  expect(finDeTurno(eventos).motivo).toBe(MOTIVO_FIN.TOPE_ITERACIONES);
}

describe("tope de iteraciones por turno (AGT-01, CA1, D-53)", () => {
  test("al tope hace una sola llamada sin herramientas con la instrucción final y emite su texto", async () => {
    const prueba = agente([...TRES_LECTURAS, respuestaTexto(RESUMEN_MODELO), respuestaTexto("Seguimos.")]);
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    const { pedidos } = prueba.llm;
    expect(pedidos).toHaveLength(MAX_ITERACIONES + 1);
    expect(pedidos.map((pedido) => pedido.herramientasDesactivadas)).toEqual([false, false, false, true]);
    expect(pedidos.map(contieneInstruccionTope)).toEqual([false, false, false, true]);
    expect(pedidos[MAX_ITERACIONES]?.mensajes.at(-1)).toEqual({
      rol: ROL_MENSAJE.SISTEMA,
      contenido: TEXTO_CIERRE.instruccionTope,
    });
    expect(textoFinal(eventos)).toBe(RESUMEN_MODELO);
    expect(errores(eventos)).toEqual([]);
    expect(finDeTurno(eventos)).toMatchObject({
      motivo: MOTIVO_FIN.TOPE_ITERACIONES,
      needsConfirmation: false,
    });

    await prueba.turno("continúa");
    expect(pedidos).toHaveLength(MAX_ITERACIONES + 2);
    const siguiente = pedidos[MAX_ITERACIONES + 1];
    expect(siguiente === undefined ? true : contieneInstruccionTope(siguiente)).toBe(false);
    expect(siguiente?.herramientasDesactivadas).toBe(false);
    historialSano(prueba);
  });

  test("si la llamada de resumen falla, el servidor arma el cierre determinista", async () => {
    const prueba = agente([...TRES_LECTURAS, ERROR_SERVIDOR]);
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    expect(prueba.llm.pedidos).toHaveLength(MAX_ITERACIONES + 1);
    esperarCierreDeterminista(eventos);
    historialSano(prueba);
  });

  test("si la llamada de resumen pide herramientas, no las ejecuta y arma el cierre determinista", async () => {
    const prueba = agente([...TRES_LECTURAS, leerCo("leer-4")]);
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    expect(prueba.llm.pedidos).toHaveLength(MAX_ITERACIONES + 1);
    expect(finesDeHerramienta(eventos, LEER)).toHaveLength(MAX_ITERACIONES);
    esperarCierreDeterminista(eventos);
    historialSano(prueba);
  });

  test("sin presupuesto justo al tope no hace la llamada de resumen y cierra de forma determinista", async () => {
    const prueba = agente(
      ["leer-1", "leer-2", "leer-3"].map((id) => gastando(leerCo(id), 300, 100)),
      1200,
    );
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    expect(prueba.llm.pedidos).toHaveLength(MAX_ITERACIONES);
    expect(usos(eventos).map((uso) => uso.totalSesion)).toEqual([400, 800, 1200]);
    esperarCierreDeterminista(eventos);
    historialSano(prueba);
  });

  test("el uso de la llamada de resumen se suma a totalSesion", async () => {
    const prueba = agente([...TRES_LECTURAS, respuestaTexto(RESUMEN_MODELO)]);
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    expect(usos(eventos).map((uso) => uso.totalSesion)).toEqual([15, 30, 45, 60]);
    historialSano(prueba);
  });

  test("el resumen del modelo pasa por la limpieza de markdown (D-60)", async () => {
    const prueba = agente([...TRES_LECTURAS, respuestaTexto("**Hecho**\n# Falta\n- armar")]);
    const eventos = await prueba.turno(`Procesa el caso ${CO}`);

    const texto = textoFinal(eventos);
    expect(texto).not.toContain("**");
    expect(texto.split("\n").some((linea) => linea.startsWith("#"))).toBe(false);
    expect(texto).toContain("Hecho");
    expect(texto).toContain("- armar");
    historialSano(prueba);
  });

  test("un turno que armó ec antes del tope termina con la pregunta de confirmación (D-63.2)", async () => {
    const prueba = agente([
      respuestaHerramientas(
        llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC }),
        llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] }),
      ),
      pasoGenerarConMapeo(EC),
      respuestaHerramientas(llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaTexto("Armé el paquete de ec-corp-andina."),
    ]);
    const eventos = await prueba.turno(`Procesa el caso ${EC}`);

    expect(prueba.llm.pedidos).toHaveLength(MAX_ITERACIONES + 1);
    expect(errores(eventos)).toEqual([]);
    expect(finDeTurno(eventos)).toMatchObject({
      motivo: MOTIVO_FIN.TOPE_ITERACIONES,
      needsConfirmation: true,
    });
    expect(confirmaciones(eventos)).toEqual([expect.objectContaining({ caso: EC })]);
    const texto = textoFinal(eventos);
    expect(texto.startsWith("Armé el paquete de ec-corp-andina.")).toBe(true);
    expect(texto.trimEnd().endsWith("?")).toBe(true);
    expect(texto.slice(texto.lastIndexOf(SEPARADOR_PARRAFOS))).toContain(EC);
    historialSano(prueba);
  });
});
