import {
  ACCION_UI,
  ESTADO_ACCESO,
  ESTADO_HERRAMIENTA,
  MAXIMO_TARJETAS_ABIERTAS,
  RESULTADO_API,
  SANGRIA_JSON,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_ERROR, TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import type {
  AccionUi,
  ErrorVisible,
  EstadoConversacion,
  EventoFinHerramientaUi,
  EventoInicioHerramientaUi,
  LlamadaDelTurno,
  ResultadoApi,
  ResumenLlamadas,
  TurnoConversacion,
  VistaTurnos,
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
  const turno: TurnoConversacion = {
    clave: estado.turnos.length,
    mensaje,
    llamadas: [],
    eventos: 0,
    textos: [],
    error: null,
  };
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

function abrirLlamada(turno: TurnoConversacion, evento: EventoInicioHerramientaUi): TurnoConversacion {
  if (turno.llamadas.some((llamada) => llamada.llamadaId === evento.llamadaId)) return turno;
  const llamada: LlamadaDelTurno = {
    llamadaId: evento.llamadaId,
    herramienta: evento.herramienta,
    caso: evento.caso,
    argumentos: evento.argumentos,
    estado: ESTADO_HERRAMIENTA.EN_CURSO,
    resumen: null,
    codigo: null,
  };
  return { ...turno, llamadas: [...turno.llamadas, llamada] };
}

function llamadaCerrada(llamada: LlamadaDelTurno, evento: EventoFinHerramientaUi): LlamadaDelTurno {
  return {
    ...llamada,
    herramienta: evento.herramienta,
    caso: evento.caso ?? llamada.caso,
    estado: evento.ok ? ESTADO_HERRAMIENTA.CORRECTA : ESTADO_HERRAMIENTA.ERROR,
    resumen: evento.resumen,
    codigo: evento.ok ? null : evento.codigo,
  };
}

function cerrarLlamada(turno: TurnoConversacion, evento: EventoFinHerramientaUi): TurnoConversacion {
  const abierta = turno.llamadas.some((llamada) => llamada.llamadaId === evento.llamadaId);
  const sinInicio: LlamadaDelTurno = {
    llamadaId: evento.llamadaId,
    herramienta: evento.herramienta,
    caso: evento.caso,
    argumentos: null,
    estado: ESTADO_HERRAMIENTA.EN_CURSO,
    resumen: null,
    codigo: null,
  };
  const llamadas = abierta ? turno.llamadas : [...turno.llamadas, sinInicio];
  return {
    ...turno,
    llamadas: llamadas.map((llamada) =>
      llamada.llamadaId === evento.llamadaId ? llamadaCerrada(llamada, evento) : llamada,
    ),
  };
}

function contarEvento(estado: EstadoConversacion): EstadoConversacion {
  return conUltimoTurno(estado, (turno) => ({ ...turno, eventos: turno.eventos + 1 }));
}

function aplicarEvento(estado: EstadoConversacion, evento: SseEvent): EstadoConversacion {
  switch (evento.tipo) {
    case TIPO_EVENTO.INICIO_TURNO:
      return { ...estado, sesionId: evento.sesionId };
    case TIPO_EVENTO.INICIO_HERRAMIENTA:
      return conUltimoTurno(estado, (turno) => abrirLlamada(turno, evento));
    case TIPO_EVENTO.FIN_HERRAMIENTA:
      return conUltimoTurno(estado, (turno) => cerrarLlamada(turno, evento));
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
  switch (accion.tipo) {
    case ACCION_UI.EVENTO:
      return accion.evento.tipo === TIPO_EVENTO.ERROR;
    case ACCION_UI.ERROR_HTTP:
      return accion.status !== RESPUESTA_HTTP.NO_AUTORIZADO;
    case ACCION_UI.ERROR_RED:
    case ACCION_UI.FIN_STREAM:
      return true;
    default:
      return false;
  }
}

export function reducirConversacion(estado: EstadoConversacion, accion: AccionUi): EstadoConversacion {
  switch (accion.tipo) {
    case ACCION_UI.ENVIAR:
      return agregarTurno(estado, accion.mensaje);
    case ACCION_UI.EVENTO:
      return aplicarEvento(contarEvento(estado), accion.evento);
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

export function resumenDeLlamadas(llamadas: readonly LlamadaDelTurno[]): ResumenLlamadas {
  return {
    total: llamadas.length,
    correctas: llamadas.filter((llamada) => llamada.estado === ESTADO_HERRAMIENTA.CORRECTA).length,
    conError: llamadas.filter((llamada) => llamada.estado === ESTADO_HERRAMIENTA.ERROR).length,
  };
}

export function grupoSeCierraAlTerminar(cantidad: number): boolean {
  return cantidad > MAXIMO_TARJETAS_ABIERTAS;
}

export function argumentosLegibles(argumentos: unknown): string {
  return JSON.stringify(argumentos ?? null, null, SANGRIA_JSON);
}

export function llamadaEnCurso({ turnos, enCurso }: VistaTurnos): LlamadaDelTurno | null {
  if (!enCurso) return null;
  const abiertas = (turnos.at(-1)?.llamadas ?? []).filter(
    (llamada) => llamada.estado === ESTADO_HERRAMIENTA.EN_CURSO,
  );
  return abiertas.at(-1) ?? null;
}

export function anuncioDeEstado(vista: VistaTurnos): string {
  if (vista.enCurso) {
    const llamada = llamadaEnCurso(vista);
    return llamada === null ? "" : TEXTO_HERRAMIENTA.anuncio(llamada.herramienta, llamada.caso);
  }
  const ultimo = vista.turnos.at(-1);
  return ultimo !== undefined && ultimo.error === null ? TEXTO_CHAT.respuestaLista : "";
}

export function etiquetaPensando(vista: VistaTurnos): string {
  const llamada = llamadaEnCurso(vista);
  return llamada === null
    ? TEXTO_CHAT.pensando
    : TEXTO_CHAT.pensandoEn(TEXTO_HERRAMIENTA.gerundio(llamada.herramienta), llamada.caso);
}

export function eventosDelTurno({ turnos }: VistaTurnos): number {
  return turnos.at(-1)?.eventos ?? 0;
}
