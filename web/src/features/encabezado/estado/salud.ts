import { ACCION_SALUD } from "@web/config/constants/ui.constants.ts";
import type { AccionSalud, EstadoSalud } from "@web/types/store.type.ts";

export const estadoSaludInicial: EstadoSalud = { salud: null, comprobando: false };

function conComprobando(estado: EstadoSalud, comprobando: boolean): EstadoSalud {
  return estado.comprobando === comprobando ? estado : { ...estado, comprobando };
}

export function reducirSalud(estado: EstadoSalud, accion: AccionSalud): EstadoSalud {
  switch (accion.tipo) {
    case ACCION_SALUD.COMPROBANDO:
      return conComprobando(estado, true);
    case ACCION_SALUD.RECIBIDA:
      return { ...estado, salud: accion.salud };
    case ACCION_SALUD.TERMINADA:
      return conComprobando(estado, false);
    default:
      return estado;
  }
}
