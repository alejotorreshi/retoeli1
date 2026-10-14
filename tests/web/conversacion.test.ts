import { describe, expect, test } from "bun:test";
import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import { estadoInicialConversacion, reducirConversacion } from "@web/state/conversacion.ts";
import type { AccionUi, EstadoConversacion } from "@web/types/chat.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

const SESION = "sesion-de-prueba";
const TURNO = "turno-1";
const MENSAJE = "procesa el caso co-industrias-delta";
const RESPUESTA = "Listo: el caso co-industrias-delta quedó mapeado.\nRevisa los faltantes.";

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function aplicar(estado: EstadoConversacion, acciones: readonly AccionUi[]): EstadoConversacion {
  return acciones.reduce(reducirConversacion, estado);
}

const turnoCompleto: readonly AccionUi[] = [
  { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
  evento({
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: SESION,
    turnoId: TURNO,
    sesionNueva: true,
    sesionExpirada: false,
  }),
  evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: RESPUESTA }),
  evento({ tipo: TIPO_EVENTO.FIN_TURNO, turnoId: TURNO, motivo: MOTIVO_FIN.FINAL, needsConfirmation: false }),
];

describe("reducirConversacion", () => {
  test("el estado inicial no tiene sesión, turnos ni turno en curso", () => {
    expect(estadoInicialConversacion).toEqual({ sesionId: null, turnos: [], enCurso: false });
  });

  test("ENVIAR agrega la burbuja de la usuaria y deja el turno en curso", () => {
    const estado = reducirConversacion(estadoInicialConversacion, {
      tipo: ACCION_UI.ENVIAR,
      mensaje: MENSAJE,
    });
    expect(estado.enCurso).toBe(true);
    expect(estado.turnos.map((turno) => turno.mensaje)).toEqual([MENSAJE]);
  });

  test("turn_start, text y turn_end dejan una burbuja, un texto del agente, la sesión y el turno cerrado", () => {
    const estado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.mensaje).toBe(MENSAJE);
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
  });

  test("un segundo ENVIAR conserva el sessionId del turno anterior", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto,
      { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
    ]);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.enCurso).toBe(true);
    expect(estado.turnos).toHaveLength(2);
    expect(estado.turnos.map((turno) => turno.clave)).toEqual([0, 1]);
  });

  test("los eventos que la pantalla todavía no pinta no cambian el estado", () => {
    const enCurso = reducirConversacion(estadoInicialConversacion, {
      tipo: ACCION_UI.ENVIAR,
      mensaje: MENSAJE,
    });
    const estado = reducirConversacion(
      enCurso,
      evento({
        tipo: TIPO_EVENTO.USO,
        turnoId: TURNO,
        entrada: 10,
        salida: 5,
        cacheHit: 0,
        totalSesion: 15,
        proveedor: "falso",
        modelo: "modelo-falso",
      }),
    );
    expect(estado).toBe(enCurso);
  });
});
