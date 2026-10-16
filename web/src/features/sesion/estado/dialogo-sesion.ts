import { ACCION_DIALOGO_SESION } from "@web/config/constants/ui.constants.ts";
import type { AccionDialogoSesion, EstadoDialogoSesion } from "@web/types/store.type.ts";

export const estadoDialogoSesionInicial: EstadoDialogoSesion = { abierto: false };

function conAbierto(estado: EstadoDialogoSesion, abierto: boolean): EstadoDialogoSesion {
  return estado.abierto === abierto ? estado : { abierto };
}

export function reducirDialogoSesion(
  estado: EstadoDialogoSesion,
  accion: AccionDialogoSesion,
): EstadoDialogoSesion {
  switch (accion.tipo) {
    case ACCION_DIALOGO_SESION.ABRIR:
      return conAbierto(estado, true);
    case ACCION_DIALOGO_SESION.CERRAR:
      return conAbierto(estado, false);
    default:
      return estado;
  }
}
