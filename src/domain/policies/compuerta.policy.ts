import { ACCION, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
} from "@/config/constants/confirmacion.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type {
  AperturaTurno,
  AutorizacionTurno,
  CasoPendiente,
  EntradaCierreCompuerta,
  EstadoCompuerta,
  EvaluacionEnvio,
  EventoCompuerta,
} from "@/domain/types/compuerta.type.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";

export function estadoLibre(): EstadoCompuerta {
  return { tipo: ESTADO_COMPUERTA.LIBRE };
}

function estadoCon(casos: readonly CasoPendiente[]): EstadoCompuerta {
  if (casos.length === 0) return estadoLibre();
  return { tipo: ESTADO_COMPUERTA.PENDIENTE, accion: ACCION.ENVIO, casos };
}

export function pendientesDe(estado: EstadoCompuerta): readonly CasoPendiente[] {
  return estado.tipo === ESTADO_COMPUERTA.PENDIENTE ? estado.casos : [];
}

export function casosPendientes(estado: EstadoCompuerta): readonly string[] {
  return pendientesDe(estado).map(({ caso }) => caso);
}

export function paqueteConocido(
  conocidos: EntradaCierreCompuerta["conocidos"],
  caso: string,
): CasoPendiente | undefined {
  return Object.hasOwn(conocidos, caso) ? conocidos[caso] : undefined;
}

function sinAutorizacion(siguiente: EstadoCompuerta, preguntarCual: boolean): AperturaTurno {
  return { autorizado: null, siguiente, preguntarCual };
}

export function abrirTurno(estado: EstadoCompuerta, decision: DecisionConfirmacion): AperturaTurno {
  if (estado.tipo === ESTADO_COMPUERTA.LIBRE) return sinAutorizacion(estadoLibre(), false);
  if (decision.decision === DECISION_CONFIRMACION.FALTA_CASO) return sinAutorizacion(estado, true);
  if (
    decision.decision === DECISION_CONFIRMACION.CONFIRMA &&
    casosPendientes(estado).includes(decision.caso)
  ) {
    return { autorizado: decision.caso, siguiente: estadoLibre(), preguntarCual: false };
  }
  return sinAutorizacion(estadoLibre(), false);
}

export function evaluarEnvio(autorizacion: AutorizacionTurno, caso: string): EvaluacionEnvio {
  if (autorizacion.usada || autorizacion.caso !== caso) return { permitido: false, siguiente: autorizacion };
  return { permitido: true, siguiente: { caso, usada: true } };
}

export function revocarAlArmar(autorizacion: AutorizacionTurno, caso: string): AutorizacionTurno {
  return autorizacion.caso === caso ? { ...autorizacion, caso: null } : autorizacion;
}

function conocido(
  caso: string,
  conocidos: EntradaCierreCompuerta["conocidos"],
  pendientes: ReadonlyMap<string, CasoPendiente>,
): CasoPendiente | undefined {
  return paqueteConocido(conocidos, caso) ?? pendientes.get(caso);
}

function aplicarEvento(
  pendientes: Map<string, CasoPendiente>,
  evento: EventoCompuerta,
  conocidos: EntradaCierreCompuerta["conocidos"],
): void {
  if (evento.tipo === EVENTO_COMPUERTA.ARMADO) {
    pendientes.set(evento.pendiente.caso, evento.pendiente);
    return;
  }
  if (evento.tipo === EVENTO_COMPUERTA.ENVIADO) {
    pendientes.delete(evento.caso);
    return;
  }
  const paquete = conocido(evento.caso, conocidos, pendientes);
  if (paquete !== undefined) pendientes.set(evento.caso, paquete);
}

export function cerrarTurno(entrada: EntradaCierreCompuerta): EstadoCompuerta {
  if (entrada.abortado) return estadoLibre();
  const pendientes = new Map(entrada.arrastrados.map((pendiente) => [pendiente.caso, pendiente] as const));
  for (const evento of entrada.eventos) aplicarEvento(pendientes, evento, entrada.conocidos);
  return estadoCon([...pendientes.values()]);
}

export function recuperarAutorizado(
  motivo: ValorDe<typeof MOTIVO_FIN>,
  autorizacion: AutorizacionTurno,
  conocidos: Readonly<Record<string, CasoPendiente>>,
): readonly CasoPendiente[] {
  const { caso, usada } = autorizacion;
  if (motivo === MOTIVO_FIN.FINAL || motivo === MOTIVO_FIN.ABORTADO) return [];
  if (caso === null || usada) return [];
  const paquete = paqueteConocido(conocidos, caso);
  return paquete === undefined ? [] : [paquete];
}
