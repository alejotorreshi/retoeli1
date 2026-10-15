import {
  ACCION_AVISO,
  ACCION_UI,
  AVISO_SESION,
  ESTADO_ACCESO,
  ESTADO_HERRAMIENTA,
  MAXIMO_TARJETAS_ABIERTAS,
  RESULTADO_API,
  SANGRIA_JSON,
  SEPARADOR_ANUNCIOS,
  TOKENS_POR_MILES,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_CONFIRMACION, TEXTO_ERROR, TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import { casoDelPanel } from "@web/state/casos.ts";
import {
  casosAbiertosEnTurno,
  marcarEnviando,
  reducirConfirmaciones,
  soltarEnvios,
} from "@web/state/confirmaciones.ts";
import type {
  AccionDeAviso,
  AccionEnviar,
  AccionUi,
  ConfirmacionDelTurno,
  ErrorVisible,
  EstadoConversacion,
  EstadoHidratado,
  EventoConfirmacionUi,
  EventoFinHerramientaUi,
  EventoInicioHerramientaUi,
  LlamadaDelTurno,
  ResultadoApi,
  ResumenLlamadas,
  TurnoConversacion,
  UsoDeSesion,
  VistaConConfirmaciones,
  VistaTurnos,
} from "@web/types/chat.type.ts";
import { CODIGO_AGENTE, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import type { ConfigResponse, SseEvent } from "@/http/types/api.type.ts";

export const estadoInicialConversacion: EstadoConversacion = {
  sesionId: null,
  turnos: [],
  enCurso: false,
  tarjetasConfirmacion: [],
  acceso: { tipo: ESTADO_ACCESO.VERIFICANDO },
  config: null,
  borrador: "",
  hidratando: false,
  avisoSesion: null,
  tokensSesion: 0,
  esperandoAvisoExpirada: false,
};

export function estadoAlCargar(sesionGuardada: string | null): EstadoConversacion {
  return sesionGuardada === null
    ? estadoInicialConversacion
    : { ...estadoInicialConversacion, sesionId: sesionGuardada, hidratando: true };
}

export function sesionDelEvento(accion: AccionUi): string | null {
  return accion.tipo === ACCION_UI.EVENTO && accion.evento.tipo === TIPO_EVENTO.INICIO_TURNO
    ? accion.evento.sesionId
    : null;
}

export function faltaConfig(estado: EstadoConversacion): boolean {
  return estado.acceso.tipo === ESTADO_ACCESO.CONCEDIDO && estado.config === null;
}

export function configResuelta(resultado: ResultadoApi<ConfigResponse>): boolean {
  return resultado.tipo === RESULTADO_API.OK || resultado.tipo === RESULTADO_API.ACCESO_VENCIDO;
}

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

function agregarTurno(estado: EstadoConversacion, { mensaje, accion }: AccionEnviar): EstadoConversacion {
  const turno: TurnoConversacion = {
    clave: estado.turnos.length,
    mensaje,
    llamadas: [],
    eventos: 0,
    textos: [],
    confirmaciones: [],
    error: null,
  };
  const tarjetasConfirmacion =
    accion === undefined ? estado.tarjetasConfirmacion : marcarEnviando(estado.tarjetasConfirmacion, accion);
  return { ...estado, turnos: [...estado.turnos, turno], enCurso: true, tarjetasConfirmacion };
}

function terminarTurno(estado: EstadoConversacion, completo: boolean): EstadoConversacion {
  const turno = estado.turnos.at(-1);
  if (!estado.enCurso || turno === undefined) return { ...estado, enCurso: false };
  return {
    ...estado,
    enCurso: false,
    tarjetasConfirmacion: reducirConfirmaciones(estado.tarjetasConfirmacion, { turno, completo }),
  };
}

function turnoRechazadoPorOcupada(estado: EstadoConversacion): boolean {
  return estado.turnos.at(-1)?.error?.codigo === CODIGO_AGENTE.SESION_OCUPADA;
}

function registrarError(estado: EstadoConversacion, error: ErrorVisible): EstadoConversacion {
  return conUltimoTurno(estado, (turno) => ({ ...turno, error }));
}

function cerrarConError(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  return terminarTurno(registrarError(estado, { codigo: null, mensaje, accion: null }), false);
}

function cortarStream(estado: EstadoConversacion): EstadoConversacion {
  if (!estado.enCurso) return estado;
  const accion = estado.sesionId === null ? null : ACCION_AVISO.RECARGAR;
  return terminarTurno(
    registrarError(estado, { codigo: null, mensaje: TEXTO_ERROR.streamCortado, accion }),
    false,
  );
}

function detenerTurno(estado: EstadoConversacion): EstadoConversacion {
  if (!estado.enCurso) return estado;
  return {
    ...estado,
    enCurso: false,
    tarjetasConfirmacion: soltarEnvios(estado.tarjetasConfirmacion),
    hidratando: estado.sesionId !== null,
  };
}

function recargarSesion(estado: EstadoConversacion): EstadoConversacion {
  if (estado.sesionId === null || estado.enCurso || estado.hidratando) return estado;
  return { ...estado, hidratando: true };
}

function pedirAcceso(estado: EstadoConversacion, aviso: string | null): EstadoConversacion {
  const turnos = estado.enCurso ? estado.turnos.slice(0, -1) : estado.turnos;
  return {
    ...estado,
    turnos,
    enCurso: false,
    tarjetasConfirmacion: soltarEnvios(estado.tarjetasConfirmacion),
    acceso: { tipo: ESTADO_ACCESO.PEDIDO, aviso },
  };
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
    resultado: null,
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
    resultado: evento.resultado,
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
    resultado: null,
  };
  const llamadas = abierta ? turno.llamadas : [...turno.llamadas, sinInicio];
  return {
    ...turno,
    llamadas: llamadas.map((llamada) =>
      llamada.llamadaId === evento.llamadaId ? llamadaCerrada(llamada, evento) : llamada,
    ),
  };
}

function registrarConfirmacion(turno: TurnoConversacion, evento: EventoConfirmacionUi): TurnoConversacion {
  const confirmacion: ConfirmacionDelTurno = {
    caso: evento.caso,
    bloqueosLegibles: evento.bloqueosLegibles,
    trasLlamadas: turno.llamadas.length,
  };
  return { ...turno, confirmaciones: [...turno.confirmaciones, confirmacion] };
}

function contarEvento(estado: EstadoConversacion): EstadoConversacion {
  return conUltimoTurno(estado, (turno) => ({ ...turno, eventos: turno.eventos + 1 }));
}

function hidratar(estado: EstadoConversacion, hidratado: EstadoHidratado): EstadoConversacion {
  return {
    ...estado,
    sesionId: hidratado.sesionId,
    turnos: hidratado.turnos,
    tarjetasConfirmacion: hidratado.tarjetasConfirmacion,
    tokensSesion: hidratado.tokensUsados,
    enCurso: false,
    hidratando: false,
    avisoSesion: null,
    esperandoAvisoExpirada: false,
  };
}

function empezarSesionNueva(estado: EstadoConversacion): EstadoConversacion {
  return {
    ...estadoInicialConversacion,
    acceso: estado.acceso,
    config: estado.config,
    borrador: estado.borrador,
  };
}

function seguirTrasExpirar(estado: EstadoConversacion, sesionId: string): EstadoConversacion {
  const actual = estado.turnos.at(-1);
  return {
    ...estado,
    sesionId,
    turnos: actual === undefined ? [] : [{ ...actual, clave: 0 }],
    tarjetasConfirmacion: [],
    avisoSesion: null,
    tokensSesion: 0,
    esperandoAvisoExpirada: true,
  };
}

function recibirTexto(estado: EstadoConversacion, texto: string): EstadoConversacion {
  if (estado.esperandoAvisoExpirada) {
    return {
      ...estado,
      esperandoAvisoExpirada: false,
      avisoSesion: { tipo: AVISO_SESION.EXPIRADA, mensaje: texto },
    };
  }
  return conUltimoTurno(estado, (turno) => ({
    ...turno,
    textos: [...turno.textos, { clave: turno.textos.length, texto }],
  }));
}

function accionDelError(codigo: string): AccionDeAviso | null {
  return codigo === CODIGO_AGENTE.PRESUPUESTO_AGOTADO ? ACCION_AVISO.NUEVA_SESION : null;
}

function sesionExpirada(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  return {
    ...estado,
    sesionId: null,
    hidratando: false,
    avisoSesion: { tipo: AVISO_SESION.EXPIRADA, mensaje },
  };
}

function sesionNoCargada(estado: EstadoConversacion, mensaje: string): EstadoConversacion {
  return { ...estado, hidratando: false, avisoSesion: { tipo: AVISO_SESION.NO_CARGADA, mensaje } };
}

function aplicarEvento(estado: EstadoConversacion, evento: SseEvent): EstadoConversacion {
  switch (evento.tipo) {
    case TIPO_EVENTO.INICIO_TURNO:
      return evento.sesionExpirada
        ? seguirTrasExpirar(estado, evento.sesionId)
        : { ...estado, sesionId: evento.sesionId };
    case TIPO_EVENTO.INICIO_HERRAMIENTA:
      return conUltimoTurno(estado, (turno) => abrirLlamada(turno, evento));
    case TIPO_EVENTO.FIN_HERRAMIENTA:
      return conUltimoTurno(estado, (turno) => cerrarLlamada(turno, evento));
    case TIPO_EVENTO.TEXTO:
      return recibirTexto(estado, evento.texto);
    case TIPO_EVENTO.CONFIRMACION_REQUERIDA:
      return conUltimoTurno(estado, (turno) => registrarConfirmacion(turno, evento));
    case TIPO_EVENTO.ERROR:
      return registrarError(estado, {
        codigo: evento.codigo,
        mensaje: evento.mensaje,
        accion: accionDelError(evento.codigo),
      });
    case TIPO_EVENTO.USO:
      return { ...estado, tokensSesion: evento.totalSesion };
    case TIPO_EVENTO.FIN_TURNO:
      return terminarTurno(estado, !turnoRechazadoPorOcupada(estado));
    default:
      return estado;
  }
}

export function reducirConversacion(estado: EstadoConversacion, accion: AccionUi): EstadoConversacion {
  switch (accion.tipo) {
    case ACCION_UI.ENVIAR:
      return agregarTurno(estado, accion);
    case ACCION_UI.EVENTO:
      return aplicarEvento(contarEvento(estado), accion.evento);
    case ACCION_UI.ERROR_HTTP:
      return accion.status === RESPUESTA_HTTP.NO_AUTORIZADO
        ? pedirAcceso(estado, accion.mensaje)
        : cerrarConError(estado, accion.mensaje);
    case ACCION_UI.ERROR_RED:
      return cerrarConError(estado, TEXTO_ERROR.sinConexion);
    case ACCION_UI.FIN_STREAM:
      return cortarStream(estado);
    case ACCION_UI.CONFIG_RECIBIDA:
      return recibirConfig(estado, accion.config);
    case ACCION_UI.ACCESO_PEDIDO:
      return pedirAcceso(estado, accion.aviso);
    case ACCION_UI.CAMBIAR_BORRADOR:
      return { ...estado, borrador: accion.borrador };
    case ACCION_UI.ACEPTADO:
      return vaciarBorradorEnviado(estado, accion.mensaje);
    case ACCION_UI.HIDRATAR:
      return hidratar(estado, accion.hidratado);
    case ACCION_UI.SESION_EXPIRADA:
      return sesionExpirada(estado, accion.mensaje);
    case ACCION_UI.SESION_NO_CARGADA:
      return sesionNoCargada(estado, accion.mensaje);
    case ACCION_UI.DETENER:
      return detenerTurno(estado);
    case ACCION_UI.RECARGAR:
      return recargarSesion(estado);
    case ACCION_UI.NUEVA_SESION:
      return empezarSesionNueva(estado);
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

export function anuncioDeEstado(vista: VistaConConfirmaciones): string {
  if (vista.enCurso) {
    const llamada = llamadaEnCurso(vista);
    return llamada === null
      ? ""
      : TEXTO_HERRAMIENTA.anuncio(llamada.herramienta, casoDelPanel(llamada, null));
  }
  const ultimo = vista.turnos.at(-1);
  if (ultimo === undefined || ultimo.error !== null) return "";
  const porConfirmar = casosAbiertosEnTurno(vista.tarjetasConfirmacion, ultimo.clave);
  return porConfirmar.length === 0
    ? TEXTO_CHAT.respuestaLista
    : [TEXTO_CHAT.respuestaLista, TEXTO_CONFIRMACION.anuncio(porConfirmar)].join(SEPARADOR_ANUNCIOS);
}

export function etiquetaPensando(vista: VistaTurnos): string {
  const llamada = llamadaEnCurso(vista);
  return llamada === null
    ? TEXTO_CHAT.pensando
    : TEXTO_CHAT.pensandoEn(TEXTO_HERRAMIENTA.gerundio(llamada.herramienta), casoDelPanel(llamada, null));
}

export function eventosDelTurno({ turnos }: VistaTurnos): number {
  return turnos.at(-1)?.eventos ?? 0;
}

export function usoDeSesion({
  tokensSesion,
  config,
}: Pick<EstadoConversacion, "tokensSesion" | "config">): UsoDeSesion | null {
  if (config === null) return null;
  return {
    usados: Math.floor(tokensSesion / TOKENS_POR_MILES),
    tope: Math.floor(config.presupuestoSesion / TOKENS_POR_MILES),
  };
}
