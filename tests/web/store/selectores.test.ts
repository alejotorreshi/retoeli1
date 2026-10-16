import { describe, expect, test } from "bun:test";
import {
  ACCION_DIALOGO_SESION,
  ACCION_SALUD,
  ACCION_UI,
  ESTADO_ACCESO,
} from "@web/config/constants/ui.constants.ts";
import { estadoRaizInicial, reducirRaiz } from "@web/store/raiz.ts";
import * as selectores from "@web/store/selectores.ts";
import type { AccionUi } from "@web/types/chat.type.ts";
import type { AccionRaiz, EstadoRaiz } from "@web/types/store.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { ConfigResponse, HealthResponse, SseEvent } from "@/http/types/api.type.ts";

const SESION = "s-1";
const TURNO = "turno-1";
const CASO = "co-industrias-delta";
const PREFIJO_SELECTOR = "seleccionar";
const CONFIG: ConfigResponse = {
  fechaEjecucion: "2026-09-03",
  zona: "America/Bogota",
  casos: [CASO],
  presupuestoSesion: 300_000,
  mensajeMaximo: 2000,
};
const SALUD: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.TOPE_DIARIO,
};

type Selector = (estado: EstadoRaiz) => unknown;

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function llamada(llamadaId: string): readonly AccionUi[] {
  const herramienta = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
  return [
    evento({
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      turnoId: TURNO,
      llamadaId,
      herramienta,
      caso: CASO,
      argumentos: { caso: CASO },
    }),
    evento({
      tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
      turnoId: TURNO,
      llamadaId,
      herramienta,
      caso: CASO,
      ok: true,
      codigo: null,
      resumen: null,
      resultado: null,
    }),
  ];
}

const HISTORIA: readonly AccionRaiz[] = [
  { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
  { tipo: ACCION_UI.ENVIAR, mensaje: `procesa el caso ${CASO}` },
  evento({
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: SESION,
    turnoId: TURNO,
    sesionNueva: true,
    sesionExpirada: false,
  }),
  ...llamada("call_1"),
  evento({
    tipo: TIPO_EVENTO.USO,
    turnoId: TURNO,
    entrada: 10,
    salida: 5,
    cacheHit: 0,
    totalSesion: 12_000,
    proveedor: "falso",
    modelo: "modelo-falso",
  }),
  evento({ tipo: TIPO_EVENTO.FIN_TURNO, turnoId: TURNO, motivo: MOTIVO_FIN.FINAL, needsConfirmation: false }),
  { tipo: ACCION_UI.ENVIAR, mensaje: "sigue" },
  ...llamada("call_2").slice(0, 1),
  { tipo: ACCION_SALUD.RECIBIDA, salud: SALUD },
  { tipo: ACCION_DIALOGO_SESION.ABRIR },
];

const MUESTRAS: readonly EstadoRaiz[] = [
  estadoRaizInicial(null),
  estadoRaizInicial(SESION),
  HISTORIA.reduce(reducirRaiz, estadoRaizInicial(null)),
];

function esSelector(valor: unknown): valor is Selector {
  return typeof valor === "function";
}

function selectoresExportados(): readonly [string, Selector][] {
  const entradas: [string, unknown][] = Object.entries(selectores);
  return entradas.flatMap(([nombre, valor]): [string, Selector][] =>
    nombre.startsWith(PREFIJO_SELECTOR) && esSelector(valor) ? [[nombre, valor]] : [],
  );
}

describe("selectores del almacén", () => {
  test("todo lo que exporta selectores.ts, salvo memoizarPorReferencia, es un selector con prefijo", () => {
    const nombres = Object.keys(selectores).filter((nombre) => nombre !== "memoizarPorReferencia");
    expect(nombres.length).toBeGreaterThanOrEqual(25);
    expect(nombres.filter((nombre) => !nombre.startsWith(PREFIJO_SELECTOR))).toEqual([]);
    expect(selectoresExportados()).toHaveLength(nombres.length);
  });

  test("cada selector devuelve el mismo valor, por Object.is, dos veces sobre el mismo estado", () => {
    for (const estado of MUESTRAS) {
      for (const [nombre, seleccionar] of selectoresExportados()) {
        expect({ nombre, estable: Object.is(seleccionar(estado), seleccionar(estado)) }).toEqual({
          nombre,
          estable: true,
        });
      }
    }
  });

  test("los derivados de la conversación conservan su referencia cuando solo cambia otro slice", () => {
    const estado = MUESTRAS[2] ?? estadoRaizInicial(null);
    const otraRaiz = reducirRaiz(estado, { tipo: ACCION_DIALOGO_SESION.CERRAR });
    expect(otraRaiz).not.toBe(estado);
    expect(otraRaiz.conversacion).toBe(estado.conversacion);
    for (const [nombre, seleccionar] of selectoresExportados()) {
      expect({ nombre, igual: Object.is(seleccionar(estado), seleccionar(otraRaiz)) }).toEqual({
        nombre,
        igual: nombre !== "seleccionarDialogoAbierto",
      });
    }
  });

  test("sin config los casos son siempre el mismo arreglo vacío", () => {
    const sinConfig = estadoRaizInicial(null);
    expect(selectores.seleccionarCasos(sinConfig)).toEqual([]);
    expect(selectores.seleccionarCasos(sinConfig)).toBe(
      selectores.seleccionarCasos(estadoRaizInicial(SESION)),
    );
  });

  test("los selectores leen lo que app.tsx derivaba del estado y de la salud", () => {
    const estado = MUESTRAS[2] ?? estadoRaizInicial(null);
    expect(selectores.seleccionarAcceso(estado)).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
    expect(selectores.seleccionarAccesoConcedido(estado)).toBe(true);
    expect(selectores.seleccionarFaltaConfig(estado)).toBe(false);
    expect(selectores.seleccionarCasos(estado)).toEqual([CASO]);
    expect(selectores.seleccionarFechaEjecucion(estado)).toBe(CONFIG.fechaEjecucion);
    expect(selectores.seleccionarZona(estado)).toBe(CONFIG.zona);
    expect(selectores.seleccionarMensajeMaximo(estado)).toBe(CONFIG.mensajeMaximo);
    expect(selectores.seleccionarTurnos(estado)).toHaveLength(2);
    expect(selectores.seleccionarConHistorial(estado)).toBe(true);
    expect(selectores.seleccionarEnCurso(estado)).toBe(true);
    expect(selectores.seleccionarHidratando(estado)).toBe(false);
    expect(selectores.seleccionarSesionPorCargar(estado)).toBeNull();
    expect(selectores.seleccionarSalud(estado)).toBe(SALUD);
    expect(selectores.seleccionarEstadoLlm(estado)).toBe(ESTADO_LLM.TOPE_DIARIO);
    expect(selectores.seleccionarComprobando(estado)).toBe(false);
    expect(selectores.seleccionarEnvioEnPausa(estado)).toBe(true);
    expect(selectores.seleccionarEnvioDeshabilitado(estado)).toBe(true);
    expect(selectores.seleccionarUsoDeSesion(estado)).toEqual({ usados: 12, tope: 300 });
    expect(selectores.seleccionarEventosDelTurno(estado)).toBe(1);
    expect(selectores.seleccionarProgresos(estado).map(({ caso }) => caso)).toEqual([CASO]);
    expect(selectores.seleccionarFirmaDelProgreso(estado)).toContain(CASO);
    expect(selectores.seleccionarMarcasDeArchivos(estado).get(CASO)).toBe(1);
    expect(selectores.seleccionarDialogoAbierto(estado)).toBe(true);
  });

  test("el envío queda deshabilitado mientras se hidrata la sesión, igual que en iniciarTurno", () => {
    const guardada = estadoRaizInicial(SESION);
    expect(selectores.seleccionarHidratando(guardada)).toBe(true);
    expect(selectores.seleccionarEnCurso(guardada)).toBe(false);
    expect(selectores.seleccionarEnvioEnPausa(guardada)).toBe(false);
    expect(selectores.seleccionarEnvioDeshabilitado(guardada)).toBe(true);
    expect(selectores.seleccionarEnvioDeshabilitado(estadoRaizInicial(null))).toBe(false);
  });

  test("una sesión guardada queda por cargar aunque el acceso no esté concedido", () => {
    const guardada = estadoRaizInicial(SESION);
    expect(selectores.seleccionarHidratando(guardada)).toBe(true);
    expect(selectores.seleccionarSesionPorCargar(guardada)).toBe(SESION);
    expect(selectores.seleccionarAccesoConcedido(guardada)).toBe(false);
  });

  test("memoizarPorReferencia deriva una vez por origen", () => {
    let llamadas = 0;
    const derivar = selectores.memoizarPorReferencia((origen: { readonly n: number }) => {
      llamadas += 1;
      return [origen.n];
    });
    const origen = { n: 1 };
    expect(derivar(origen)).toBe(derivar(origen));
    expect(derivar({ n: 1 })).not.toBe(derivar(origen));
    expect(llamadas).toBe(2);
  });

  test("memoizarPorReferencia también recuerda una derivación que da undefined", () => {
    let llamadas = 0;
    const derivar = selectores.memoizarPorReferencia((origen: { readonly n: number }) => {
      llamadas += 1;
      return origen.n > 1 ? origen.n : undefined;
    });
    const origen = { n: 1 };
    expect(derivar(origen)).toBeUndefined();
    expect(derivar(origen)).toBeUndefined();
    expect(llamadas).toBe(1);
  });
});
