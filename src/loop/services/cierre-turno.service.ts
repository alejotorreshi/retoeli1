import { ACCION, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ESTADO_COMPUERTA } from "@/config/constants/confirmacion.constants.ts";
import { cierreConPregunta } from "@/domain/builders/cierre-turno.builder.ts";
import { casosPendientes, cerrarTurno } from "@/domain/policies/compuerta.policy.ts";
import type { CasoPendiente, EstadoCompuerta } from "@/domain/types/compuerta.type.ts";
import { limpiarMarkdown } from "@/domain/utils/texto-plano.util.ts";
import type { EventoConfirmacionRequerida } from "@/loop/types/evento.type.ts";
import type { CierreTurnoCompuerta, EntradaCierreTurno } from "@/loop/types/turno.type.ts";

function pendientesDe(estado: EstadoCompuerta): readonly CasoPendiente[] {
  return estado.tipo === ESTADO_COMPUERTA.PENDIENTE ? estado.casos : [];
}

function eventoConfirmacion(turnoId: string, pendiente: CasoPendiente): EventoConfirmacionRequerida {
  return {
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId,
    caso: pendiente.caso,
    accion: ACCION.ENVIO,
    bloqueos: pendiente.bloqueos,
  };
}

export function cerrarTurnoConCompuerta(entrada: EntradaCierreTurno): CierreTurnoCompuerta {
  const estado = cerrarTurno(entrada);
  const pendientes = pendientesDe(estado);
  return {
    estado,
    pendientes,
    texto: cierreConPregunta(limpiarMarkdown(entrada.texto), pendientes),
    eventosConfirmacion: pendientes.map((pendiente) => eventoConfirmacion(entrada.turnoId, pendiente)),
    needsConfirmation: casosPendientes(estado).length > 0,
  };
}
