import { ACCION_UI, ESTADO_ACCESO, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ERROR } from "@web/config/strings.ts";
import type {
  AccionUi,
  ErrorVisible,
  EstadoConversacion,
  ResultadoApi,
  TurnoConversacion,
} from "@web/types/chat.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import type { ConfigResponse, SseEvent } from "@/http/types/api.type.ts";

export const estadoInicialConversacion: EstadoConversacion = {
  sesionId: null,
  turnos: [],
  enCurso: false,
  acceso: { tipo: ESTADO_ACCESO.VERIFICANDO },
  config: null,
  borrador: "",
};

export function accionDeConfig(resultado: ResultadoApi<ConfigResponse>): AccionUi {
  switch (resultado.tipo) {
    case RESULTADO_API.OK:
      return { tipo: ACCION_UI.CONFIG_RECIBIDA, config: resultado.valor };
    case RESULTADO_API.ACCESO_VENCIDO:
      return { tipo: ACCION_UI.ACCESO_PEDIDO, aviso: null };
    default:
      return { tipo: ACCION_UI.CONFIG_RECIBIDA, config: null };
  }
}

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

function registrarError(estado: EstadoConversacion, error: ErrorVisible): EstadoConversacion {
  return conUltimoTurno(estado, (turno) => ({ ...turno, error }));
}

function cerrarConError(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  return { ...registrarError(estado, { codigo: null, mensaje }), enCurso: false };
}

function pedirAcceso(estado: EstadoConversacion, aviso: string | null): EstadoConversacion {
  const turnos = estado.enCurso ? estado.turnos.slice(0, -1) : estado.turnos;
  return { ...estado, turnos, enCurso: false, acceso: { tipo: ESTADO_ACCESO.PEDIDO, aviso } };
}

function recibirConfig(estado: EstadoConversacion, config: ConfigResponse | null): EstadoConversacion {
  return { ...estado, acceso: { tipo: ESTADO_ACCESO.CONCEDIDO }, config: config ?? estado.config };
}

function vaciarBorradorEnviado(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  return estado.borrador.trim() === mensaje ? { ...estado, borrador: "" } : estado;
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
    case TIPO_EVENTO.ERROR:
      return registrarError(estado, { codigo: evento.codigo, mensaje: evento.mensaje });
    case TIPO_EVENTO.FIN_TURNO:
      return { ...estado, enCurso: false };
    default:
      return estado;
  }
}

export function esFalloDeTurno(accion: AccionUi): boolean {
  return accion.tipo === ACCION_UI.EVENTO && accion.evento.tipo === TIPO_EVENTO.ERROR;
}

export function reducirConversacion(estado: EstadoConversacion, accion: AccionUi): EstadoConversacion {
  switch (accion.tipo) {
    case ACCION_UI.ENVIAR:
      return agregarTurno(estado, accion.mensaje);
    case ACCION_UI.EVENTO:
      return aplicarEvento(estado, accion.evento);
    case ACCION_UI.ERROR_HTTP:
      return accion.status === RESPUESTA_HTTP.NO_AUTORIZADO
        ? pedirAcceso(estado, accion.mensaje)
        : cerrarConError(estado, accion.mensaje);
    case ACCION_UI.ERROR_RED:
      return cerrarConError(estado, TEXTO_ERROR.sinConexion);
    case ACCION_UI.FIN_STREAM:
      return estado.enCurso ? cerrarConError(estado, TEXTO_ERROR.streamCortado) : estado;
    case ACCION_UI.CONFIG_RECIBIDA:
      return recibirConfig(estado, accion.config);
    case ACCION_UI.ACCESO_PEDIDO:
      return pedirAcceso(estado, accion.aviso);
    case ACCION_UI.CAMBIAR_BORRADOR:
      return { ...estado, borrador: accion.borrador };
    case ACCION_UI.ACEPTADO:
      return vaciarBorradorEnviado(estado, accion.mensaje);
    default:
      return estado;
  }
}
