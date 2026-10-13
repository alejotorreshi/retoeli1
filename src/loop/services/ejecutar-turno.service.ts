import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import {
  CODIGO_AGENTE,
  EVENTO_BITACORA,
  MARGEN_CANDADO_SESION_MS,
  MOTIVO_FIN,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { DECISION_CONFIRMACION, ESTADO_COMPUERTA } from "@/config/constants/confirmacion.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE, TEXTO_SESION } from "@/config/strings.ts";
import { abrirTurno, casosPendientes, estadoLibre } from "@/domain/policies/compuerta.policy.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import type { AperturaTurno, CasoPendiente, EstadoCompuerta } from "@/domain/types/compuerta.type.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";
import { bitacoraDelTurno, observadorDelTurno } from "@/loop/services/bitacora-turno.service.ts";
import { resolverTurno } from "@/loop/services/conversacion-turno.service.ts";
import {
  anotarFin,
  cerrarCompuerta,
  guardarInterrumpido,
  guardarSesion,
} from "@/loop/services/guardado-turno.service.ts";
import type { EventoInicioTurno } from "@/loop/types/evento.type.ts";
import type {
  Cierre,
  CierreTurnoCompuerta,
  DependenciasTurno,
  Ejecucion,
  EntradaTurno,
  FinDeTurno,
  Sesion,
  Turno,
} from "@/loop/types/turno.type.ts";

export function sesionVacia(id: string): Sesion {
  return { id, historial: [], tokensUsados: 0, compuerta: estadoLibre(), paquetesConocidos: {} };
}

function arrastradosDe(apertura: AperturaTurno): readonly CasoPendiente[] {
  const { siguiente } = apertura;
  return apertura.preguntarCual && siguiente.tipo === ESTADO_COMPUERTA.PENDIENTE ? siguiente.casos : [];
}

function decisionDe(entrada: EntradaTurno, compuerta: EstadoCompuerta): DecisionConfirmacion {
  const { confirmacion } = entrada;
  if (confirmacion === undefined) {
    return clasificarConfirmacion(entrada.mensaje, casosPendientes(compuerta));
  }
  return confirmacion.aprobada
    ? { decision: DECISION_CONFIRMACION.CONFIRMA, caso: confirmacion.caso }
    : { decision: DECISION_CONFIRMACION.RECHAZA };
}

function crearTurno(
  entrada: EntradaTurno,
  deps: DependenciasTurno,
  base: Pick<Turno, "turnoId" | "candado" | "sesion" | "bitacora">,
): Turno {
  const { sesion } = base;
  const plazo = AbortSignal.timeout(deps.deadlineMs);
  const llamante = entrada.signal ?? null;
  const apertura = abrirTurno(sesion.compuerta, decisionDe(entrada, sesion.compuerta));
  return {
    ...base,
    usuario: { rol: ROL_MENSAJE.USUARIO, contenido: entrada.mensaje },
    pasos: [],
    signal: AbortSignal.any(llamante === null ? [plazo] : [llamante, plazo]),
    llamante,
    deps,
    observador: observadorDelTurno(base.bitacora),
    inicioMs: Date.now(),
    arrastrados: arrastradosDe(apertura),
    eventosCompuerta: [],
    llamadas: [],
    autorizacion: { caso: apertura.autorizado, usada: false },
    conocidos: sesion.paquetesConocidos,
    guardado: false,
  };
}

async function* emitirCierre(turno: Turno, cierre: Cierre, compuerta: CierreTurnoCompuerta): Ejecucion<void> {
  if (!cierre.porError || compuerta.texto !== "") {
    yield { tipo: TIPO_EVENTO.TEXTO, turnoId: turno.turnoId, texto: compuerta.texto };
  }
  yield* compuerta.eventosConfirmacion;
}

async function* rechazarOcupada(inicio: EventoInicioTurno, bitacora: BitacoraEstructurada): Ejecucion<void> {
  const codigo = CODIGO_AGENTE.SESION_OCUPADA;
  bitacora.advertir(EVENTO_BITACORA.TURNO_FIN, {
    motivo: MOTIVO_FIN.ERROR,
    codigo,
    needsConfirmation: false,
  });
  yield inicio;
  yield { tipo: TIPO_EVENTO.ERROR, turnoId: inicio.turnoId, codigo, mensaje: MENSAJE_AGENTE[codigo] };
  yield {
    tipo: TIPO_EVENTO.FIN_TURNO,
    turnoId: inicio.turnoId,
    motivo: MOTIVO_FIN.ERROR,
    needsConfirmation: false,
  };
}

async function* atender(turno: Turno, inicio: EventoInicioTurno): Ejecucion<FinDeTurno> {
  yield inicio;
  if (inicio.sesionExpirada) {
    yield { tipo: TIPO_EVENTO.TEXTO, turnoId: turno.turnoId, texto: TEXTO_SESION.expirada };
  }
  const cierre = yield* resolverTurno(turno);
  const compuerta = cerrarCompuerta(turno, cierre);
  const sesionGuardada = guardarSesion(turno, cierre, compuerta);
  anotarFin(turno, cierre, {
    needsConfirmation: compuerta.needsConfirmation,
    abandonado: false,
    sesionGuardada,
  });
  yield* emitirCierre(turno, cierre, compuerta);
  return { motivo: cierre.motivo, needsConfirmation: compuerta.needsConfirmation };
}

export async function* ejecutarTurno(entrada: EntradaTurno, deps: DependenciasTurno): Ejecucion<void> {
  const turnoId = deps.nuevoId();
  const abierta = deps.sesiones.abrir(entrada.sesionId);
  const sesionId = abierta.sesion.id;
  const inicio: EventoInicioTurno = {
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId,
    turnoId,
    sesionNueva: abierta.nueva,
    sesionExpirada: abierta.expirada,
  };
  const bitacora = bitacoraDelTurno(deps.bitacora, sesionId, turnoId);
  bitacora.info(EVENTO_BITACORA.TURNO_INICIO, {
    mensajeLargo: entrada.mensaje.length,
    sesionNueva: abierta.nueva,
    sesionExpirada: abierta.expirada,
  });
  const candado = deps.sesiones.ocupar(sesionId, deps.deadlineMs + MARGEN_CANDADO_SESION_MS);
  if (candado === null) return yield* rechazarOcupada(inicio, bitacora);
  const turno = crearTurno(entrada, deps, { turnoId, candado, sesion: abierta.sesion, bitacora });
  let fin: FinDeTurno;
  try {
    fin = yield* atender(turno, inicio);
  } finally {
    if (!turno.guardado) guardarInterrumpido(turno);
    deps.sesiones.liberar(sesionId, candado);
  }
  yield { tipo: TIPO_EVENTO.FIN_TURNO, turnoId, ...fin };
}
