import { ACCION, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
} from "@/config/constants/confirmation.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type {
  AperturaTurno,
  AutorizacionTurno,
  CasoPendiente,
  CasosEnviados,
  EntradaCierreCompuerta,
  EstadoCompuerta,
  EvaluacionEnvio,
  EventoCompuerta,
  PaquetesConocidos,
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

export function paqueteConocido(conocidos: PaquetesConocidos, caso: string): CasoPendiente | undefined {
  return Object.hasOwn(conocidos, caso) ? conocidos[caso] : undefined;
}

function estadoSin(estado: EstadoCompuerta, caso: string): EstadoCompuerta {
  return estadoCon(pendientesDe(estado).filter((pendiente) => pendiente.caso !== caso));
}

export function abrirTurno(estado: EstadoCompuerta, decision: DecisionConfirmacion): AperturaTurno {
  if (estado.tipo === ESTADO_COMPUERTA.LIBRE || decision.decision === DECISION_CONFIRMACION.RECHAZA) {
    return { autorizado: null, siguiente: estadoLibre() };
  }
  if (
    decision.decision === DECISION_CONFIRMACION.CONFIRMA &&
    casosPendientes(estado).includes(decision.caso)
  ) {
    return { autorizado: decision.caso, siguiente: estadoSin(estado, decision.caso) };
  }
  return { autorizado: null, siguiente: estado };
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
  conocidos: PaquetesConocidos,
  pendientes: ReadonlyMap<string, CasoPendiente>,
): CasoPendiente | undefined {
  return paqueteConocido(conocidos, caso) ?? pendientes.get(caso);
}

function reabrirConocido(
  pendientes: Map<string, CasoPendiente>,
  enviados: ReadonlySet<string>,
  caso: string,
  conocidos: PaquetesConocidos,
): void {
  if (enviados.has(caso)) return;
  const paquete = conocido(caso, conocidos, pendientes);
  if (paquete !== undefined) pendientes.set(caso, paquete);
}

function aplicarEvento(
  pendientes: Map<string, CasoPendiente>,
  enviados: Set<string>,
  evento: EventoCompuerta,
  conocidos: PaquetesConocidos,
): void {
  switch (evento.tipo) {
    case EVENTO_COMPUERTA.ARMADO:
      pendientes.set(evento.pendiente.caso, evento.pendiente);
      enviados.delete(evento.pendiente.caso);
      return;
    case EVENTO_COMPUERTA.ENVIADO:
      pendientes.delete(evento.caso);
      enviados.add(evento.caso);
      return;
    case EVENTO_COMPUERTA.BLOQUEADO:
    case EVENTO_COMPUERTA.FALLIDO:
      reabrirConocido(pendientes, enviados, evento.caso, conocidos);
  }
}

function plegarEventos(
  pendientes: Map<string, CasoPendiente>,
  enviados: CasosEnviados,
  eventos: readonly EventoCompuerta[],
  conocidos: PaquetesConocidos,
): ReadonlySet<string> {
  const enviadosTrasPliegue = new Set(enviados);
  for (const evento of eventos) aplicarEvento(pendientes, enviadosTrasPliegue, evento, conocidos);
  return enviadosTrasPliegue;
}

export function cerrarTurno(entrada: EntradaCierreCompuerta): EstadoCompuerta {
  if (entrada.abortado) return estadoLibre();
  const pendientes = new Map(entrada.arrastrados.map((pendiente) => [pendiente.caso, pendiente] as const));
  plegarEventos(pendientes, entrada.enviados, entrada.eventos, entrada.conocidos);
  return estadoCon([...pendientes.values()]);
}

export function enviadosTrasEventos(
  enviados: CasosEnviados,
  eventos: readonly EventoCompuerta[],
): CasosEnviados {
  return [...plegarEventos(new Map(), enviados, eventos, {})];
}

export function recuperarAutorizado(
  motivo: ValorDe<typeof MOTIVO_FIN>,
  autorizacion: AutorizacionTurno,
  conocidos: PaquetesConocidos,
): readonly CasoPendiente[] {
  const { caso, usada } = autorizacion;
  if (motivo === MOTIVO_FIN.ABORTADO) return [];
  if (caso === null || usada) return [];
  const paquete = paqueteConocido(conocidos, caso);
  return paquete === undefined ? [] : [paquete];
}
