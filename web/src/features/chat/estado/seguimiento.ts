import {
  DISTANCIA_PEGADO_AL_FINAL,
  SENAL_SEGUIMIENTO,
  TOLERANCIA_FONDO,
} from "@web/config/constants/ui.constants.ts";
import type { EstadoSeguimiento, SenalSeguimiento } from "@web/types/ui.type.ts";

export const seguimientoInicial: EstadoSeguimiento = {
  pegado: true,
  contenidoNuevo: false,
  posicion: null,
  distancia: null,
};

function conCambios(estado: EstadoSeguimiento, siguiente: EstadoSeguimiento): EstadoSeguimiento {
  const igual =
    siguiente.pegado === estado.pegado &&
    siguiente.contenidoNuevo === estado.contenidoNuevo &&
    siguiente.posicion === estado.posicion &&
    siguiente.distancia === estado.distancia;
  return igual ? estado : siguiente;
}

function anotarPosicion(estado: EstadoSeguimiento, posicion: number): EstadoSeguimiento {
  return conCambios(estado, { ...estado, posicion });
}

function anotarMedida(estado: EstadoSeguimiento, posicion: number, distancia: number): EstadoSeguimiento {
  return conCambios(estado, { ...estado, posicion, distancia });
}

function volverAlFinal(estado: EstadoSeguimiento): EstadoSeguimiento {
  return conCambios(estado, { ...estado, pegado: true, contenidoNuevo: false });
}

function subio(estado: EstadoSeguimiento, posicion: number): boolean {
  return estado.posicion !== null && posicion < estado.posicion;
}

function seAcercoAlFinal(estado: EstadoSeguimiento, distancia: number): boolean {
  return estado.distancia !== null && distancia < estado.distancia;
}

function enElFondo(distancia: number): boolean {
  return distancia <= TOLERANCIA_FONDO;
}

function cercaDelFinal(distancia: number): boolean {
  return distancia <= DISTANCIA_PEGADO_AL_FINAL;
}

function pegarEn(estado: EstadoSeguimiento, posicion: number, distancia: number): EstadoSeguimiento {
  return conCambios(estado, { pegado: true, contenidoNuevo: false, posicion, distancia });
}

function desplazar(estado: EstadoSeguimiento, posicion: number, distancia: number): EstadoSeguimiento {
  if (enElFondo(distancia)) return pegarEn(estado, posicion, distancia);
  if (subio(estado, posicion)) return conCambios(estado, { ...estado, pegado: false, posicion, distancia });
  if (seAcercoAlFinal(estado, distancia) && cercaDelFinal(distancia))
    return pegarEn(estado, posicion, distancia);
  return anotarMedida(estado, posicion, distancia);
}

function hayTurnos(turnos: number): boolean {
  return turnos > 0;
}

function crecer(estado: EstadoSeguimiento, distancia: number, turnos: number): EstadoSeguimiento {
  if (!hayTurnos(turnos) || estado.pegado) return estado;
  return conCambios(estado, { ...estado, contenidoNuevo: true, distancia });
}

export function debeSeguirAlFinal(estado: EstadoSeguimiento, turnos: number): boolean {
  return hayTurnos(turnos) && estado.pegado;
}

export function reducirSeguimiento(estado: EstadoSeguimiento, senal: SenalSeguimiento): EstadoSeguimiento {
  switch (senal.tipo) {
    case SENAL_SEGUIMIENTO.AJUSTE_PROPIO:
      return anotarPosicion(estado, senal.posicion);
    case SENAL_SEGUIMIENTO.DESPLAZAMIENTO:
      return desplazar(estado, senal.posicion, senal.distancia);
    case SENAL_SEGUIMIENTO.CRECIMIENTO:
      return crecer(estado, senal.distancia, senal.turnos);
    case SENAL_SEGUIMIENTO.ENVIO:
    case SENAL_SEGUIMIENTO.IR_AL_FINAL:
      return volverAlFinal(estado);
  }
}
