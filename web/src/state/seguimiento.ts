import { DISTANCIA_PEGADO_AL_FINAL, SENAL_SEGUIMIENTO } from "@web/config/constants/ui.constants.ts";
import type { EstadoSeguimiento, SenalSeguimiento } from "@web/types/ui.type.ts";

export const seguimientoInicial: EstadoSeguimiento = {
  pegado: true,
  contenidoNuevo: false,
  posicion: null,
};

function conCambios(estado: EstadoSeguimiento, siguiente: EstadoSeguimiento): EstadoSeguimiento {
  const igual =
    siguiente.pegado === estado.pegado &&
    siguiente.contenidoNuevo === estado.contenidoNuevo &&
    siguiente.posicion === estado.posicion;
  return igual ? estado : siguiente;
}

function anotarPosicion(estado: EstadoSeguimiento, posicion: number): EstadoSeguimiento {
  return conCambios(estado, { ...estado, posicion });
}

function volverAlFinal(estado: EstadoSeguimiento): EstadoSeguimiento {
  return conCambios(estado, { ...estado, pegado: true, contenidoNuevo: false });
}

function subio(estado: EstadoSeguimiento, posicion: number): boolean {
  return estado.posicion !== null && posicion < estado.posicion;
}

function desplazar(estado: EstadoSeguimiento, posicion: number, distancia: number): EstadoSeguimiento {
  if (distancia <= DISTANCIA_PEGADO_AL_FINAL) {
    return conCambios(estado, { pegado: true, contenidoNuevo: false, posicion });
  }
  const pegado = subio(estado, posicion) ? false : estado.pegado;
  return conCambios(estado, { ...estado, pegado, posicion });
}

function crecer(estado: EstadoSeguimiento): EstadoSeguimiento {
  if (estado.pegado) return estado;
  return conCambios(estado, { ...estado, contenidoNuevo: true });
}

export function reducirSeguimiento(estado: EstadoSeguimiento, senal: SenalSeguimiento): EstadoSeguimiento {
  switch (senal.tipo) {
    case SENAL_SEGUIMIENTO.AJUSTE_PROPIO:
      return anotarPosicion(estado, senal.posicion);
    case SENAL_SEGUIMIENTO.DESPLAZAMIENTO:
      return desplazar(estado, senal.posicion, senal.distancia);
    case SENAL_SEGUIMIENTO.CRECIMIENTO:
      return crecer(estado);
    case SENAL_SEGUIMIENTO.ENVIO:
    case SENAL_SEGUIMIENTO.IR_AL_FINAL:
      return volverAlFinal(estado);
  }
}
