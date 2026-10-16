import { describe, expect, test } from "bun:test";
import { ACCION_UI, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { crearInstancia } from "@web/store/instancia.ts";
import type { AccionUi, Despachar } from "@web/types/chat.type.ts";
import type { Dependencias, InstanciaAlmacen } from "@web/types/store.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import type { ChatBody, SseEvent } from "@/http/types/api.type.ts";

const SESION = "s-1";
const TURNO = "turno-1";
const MENSAJE = "hola";
const RESPUESTA = "Listo";
const SIN_RED = { tipo: RESULTADO_API.SIN_RED } as const;

type LlamadaAlTurno = {
  readonly pedido: ChatBody;
  readonly despachar: Despachar;
  readonly signal: AbortSignal;
  readonly alTerminarTurno: () => void;
};

type GuionDelTurno = (llamada: LlamadaAlTurno) => Promise<void>;

type Falsos = {
  readonly dependencias: Dependencias;
  readonly turnos: LlamadaAlTurno[];
  readonly guardadas: string[];
  readonly olvidos: { cantidad: number };
};

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

const INICIO: AccionUi = evento({
  tipo: TIPO_EVENTO.INICIO_TURNO,
  sesionId: SESION,
  turnoId: TURNO,
  sesionNueva: true,
  sesionExpirada: false,
});

const TEXTO: AccionUi = evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: RESPUESTA });

const FIN: AccionUi = evento({
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
});

const turnoCompleto: GuionDelTurno = async ({ despachar }) => {
  for (const accion of [INICIO, TEXTO, FIN]) despachar(accion);
};

function crearFalsos(guion: GuionDelTurno, sesionGuardada: string | null = null): Falsos {
  const turnos: LlamadaAlTurno[] = [];
  const guardadas: string[] = [];
  const olvidos = { cantidad: 0 };
  const dependencias: Dependencias = {
    enviarTurno: async (pedido, despachar, signal, alTerminarTurno) => {
      const llamada = { pedido, despachar, signal, alTerminarTurno };
      turnos.push(llamada);
      await guion(llamada);
    },
    obtenerConfig: async () => SIN_RED,
    obtenerSalud: async () => SIN_RED,
    obtenerSesionAsentada: async () => SIN_RED,
    leerSesionGuardada: () => sesionGuardada,
    guardarSesionId: (sesionId) => {
      guardadas.push(sesionId);
    },
    olvidarSesion: () => {
      olvidos.cantidad += 1;
    },
  };
  return { dependencias, turnos, guardadas, olvidos };
}

function turnoRetenido(): { readonly guion: GuionDelTurno; readonly soltar: () => void } {
  const { promise, resolve } = Promise.withResolvers<void>();
  return { guion: () => promise, soltar: () => resolve() };
}

async function esperarTurnos(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function conversacion(instancia: InstanciaAlmacen) {
  return instancia.almacen.leer().conversacion;
}

describe("acciones del almacén: envío de un turno", () => {
  test("enviarTexto lleva el mensaje por enviarTurno y deja el turno terminado en el estado", async () => {
    const falsos = crearFalsos(turnoCompleto);
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    const estado = conversacion(instancia);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.mensaje).toBe(MENSAJE);
    expect(estado.turnos[0]?.textos.map(({ texto }) => texto)).toEqual([RESPUESTA]);
    expect(estado.enCurso).toBe(false);
    expect(estado.sesionId).toBe(SESION);
    expect(falsos.guardadas).toEqual([SESION]);
  });

  test("enviarTurno recibe el cuerpo, una señal de aborto y el refresco de salud del almacén", async () => {
    const falsos = crearFalsos(turnoCompleto);
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(` ${MENSAJE} `);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(1);
    expect(falsos.turnos[0]?.pedido).toEqual({ sessionId: null, message: MENSAJE });
    expect(falsos.turnos[0]?.signal).toBeInstanceOf(AbortSignal);
    expect(falsos.turnos[0]?.alTerminarTurno).toBe(instancia.acciones.refrescarSalud);
  });

  test("ENVIAR se despacha antes de llamar a enviarTurno", () => {
    const enCursoAlEnviar: boolean[] = [];
    const falsos = crearFalsos(async () => {
      enCursoAlEnviar.push(conversacion(instancia).enCurso);
    });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    expect(enCursoAlEnviar).toEqual([true]);
  });

  test("enviarTexto con un mensaje en blanco no llama a enviarTurno", async () => {
    const falsos = crearFalsos(turnoCompleto);
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto("   ");
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(0);
    expect(conversacion(instancia).turnos).toHaveLength(0);
  });

  test("un segundo enviarTexto mientras el primer turno sigue abierto no llama otra vez a enviarTurno", async () => {
    const retenido = turnoRetenido();
    const falsos = crearFalsos(retenido.guion);
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(1);
    retenido.soltar();
  });

  test("la sesión guardada arranca hidratando y bloquea el envío hasta cargarla", async () => {
    const falsos = crearFalsos(turnoCompleto, SESION);
    const instancia = crearInstancia(falsos.dependencias);
    expect(conversacion(instancia).sesionId).toBe(SESION);
    expect(conversacion(instancia).hidratando).toBe(true);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(0);
  });
});
