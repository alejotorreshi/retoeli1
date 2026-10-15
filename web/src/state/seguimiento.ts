import {
  DISTANCIA_PEGADO_AL_FINAL,
  SENAL_SEGUIMIENTO,
  VENTANA_INTENCION_USUARIA_MS,
} from "@web/config/constants/ui.constants.ts";
import type { EstadoSeguimiento, SenalSeguimiento } from "@web/types/ui.type.ts";

export const seguimientoInicial: EstadoSeguimiento = {
  pegado: true,
  contenidoNuevo: false,
  intencionMs: null,
};

function hayIntencionVigente(estado: EstadoSeguimiento, ms: number): boolean {
  return estado.intencionMs !== null && ms - estado.intencionMs <= VENTANA_INTENCION_USUARIA_MS;
}

function volverAlFinal(estado: EstadoSeguimiento): EstadoSeguimiento {
  if (estado.pegado && !estado.contenidoNuevo && estado.intencionMs === null) return estado;
  return seguimientoInicial;
}

function desplazar(estado: EstadoSeguimiento, ms: number, distancia: number): EstadoSeguimiento {
  if (!hayIntencionVigente(estado, ms)) return estado;
  const pegado = distancia <= DISTANCIA_PEGADO_AL_FINAL;
  const contenidoNuevo = pegado ? false : estado.contenidoNuevo;
  if (pegado === estado.pegado && contenidoNuevo === estado.contenidoNuevo) return estado;
  return { ...estado, pegado, contenidoNuevo };
}

function crecer(estado: EstadoSeguimiento): EstadoSeguimiento {
  if (estado.pegado || estado.contenidoNuevo) return estado;
  return { ...estado, contenidoNuevo: true };
}

export function reducirSeguimiento(estado: EstadoSeguimiento, senal: SenalSeguimiento): EstadoSeguimiento {
  switch (senal.tipo) {
    case SENAL_SEGUIMIENTO.INTENCION:
      return { ...estado, intencionMs: senal.ms };
    case SENAL_SEGUIMIENTO.DESPLAZAMIENTO:
      return desplazar(estado, senal.ms, senal.distancia);
    case SENAL_SEGUIMIENTO.CRECIMIENTO:
      return crecer(estado);
    case SENAL_SEGUIMIENTO.ENVIO:
    case SENAL_SEGUIMIENTO.IR_AL_FINAL:
      return volverAlFinal(estado);
  }
}
