import { ACCION, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import { cierreDelTurno } from "@/domain/builders/cierre-turno.builder.ts";
import { cerrarTurno, desenlacesDeEnvio, pendientesDe } from "@/domain/policies/compuerta.policy.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import { limpiarMarkdown } from "@/domain/utils/texto-plano.util.ts";
import type { EventoConfirmacionRequerida } from "@/loop/types/evento.type.ts";
import type { CierreTurnoCompuerta, EntradaCierreTurno } from "@/loop/types/turno.type.ts";

function eventoConfirmacion(turnoId: string, pendiente: CasoPendiente): EventoConfirmacionRequerida {
  return {
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId,
    caso: pendiente.caso,
    accion: ACCION.ENVIO,
    bloqueos: pendiente.bloqueos,
    bloqueosLegibles: motivosDeBloqueo({ motivos_bloqueo: pendiente.motivos }),
  };
}

export function cerrarTurnoConCompuerta(entrada: EntradaCierreTurno): CierreTurnoCompuerta {
  const estado = cerrarTurno(entrada);
  const pendientes = pendientesDe(estado);
  return {
    estado,
    pendientes,
    texto: cierreDelTurno(limpiarMarkdown(entrada.texto), desenlacesDeEnvio(entrada), pendientes),
    eventosConfirmacion: pendientes.map((pendiente) => eventoConfirmacion(entrada.turnoId, pendiente)),
    needsConfirmation: pendientes.length > 0,
  };
}
