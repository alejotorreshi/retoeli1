import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import type { AccionUi, EstadoConversacion, TurnoConversacion } from "@web/types/chat.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

export const estadoInicialConversacion: EstadoConversacion = {
  sesionId: null,
  turnos: [],
  enCurso: false,
};

function conUltimoTurno(
  estado: EstadoConversacion,
  cambiar: (turno: TurnoConversacion) => TurnoConversacion,
): EstadoConversacion {
  const ultimo = estado.turnos.at(-1);
  if (ultimo === undefined) return estado;
  return { ...estado, turnos: [...estado.turnos.slice(0, -1), cambiar(ultimo)] };
}

function agregarTurno(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  const turno: TurnoConversacion = { clave: estado.turnos.length, mensaje, textos: [], error: null };
  return { ...estado, turnos: [...estado.turnos, turno], enCurso: true };
}

function aplicarEvento(estado: EstadoConversacion, evento: SseEvent): EstadoConversacion {
  switch (evento.tipo) {
    case TIPO_EVENTO.INICIO_TURNO:
      return { ...estado, sesionId: evento.sesionId };
    case TIPO_EVENTO.TEXTO:
      return conUltimoTurno(estado, (turno) => ({
        ...turno,
        textos: [...turno.textos, { clave: turno.textos.length, texto: evento.texto }],
      }));
    case TIPO_EVENTO.FIN_TURNO:
      return { ...estado, enCurso: false };
    default:
      return estado;
  }
}

export function reducirConversacion(estado: EstadoConversacion, accion: AccionUi): EstadoConversacion {
  switch (accion.tipo) {
    case ACCION_UI.ENVIAR:
      return agregarTurno(estado, accion.mensaje);
    case ACCION_UI.EVENTO:
      return aplicarEvento(estado, accion.evento);
    default:
      return estado;
  }
}
