import { ACCION, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  DESENLACE_ENVIO,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
} from "@/config/constants/confirmation.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type {
  AperturaTurno,
  AutorizacionTurno,
  CasoPendiente,
  CasosEnviados,
  DesenlaceEnvio,
  EntradaCierreCompuerta,
  EntradaDesenlaces,
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
  if (decision.decision === DECISION_CONFIRMACION.CANCELA_CASO) {
    return { autorizado: null, siguiente: estadoSin(estado, decision.caso) };
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
    case EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO:
      reabrirConocido(pendientes, enviados, evento.caso, conocidos);
      return;
    case EVENTO_COMPUERTA.TRUNCADO:
      if (evento.caso !== null) reabrirConocido(pendientes, enviados, evento.caso, conocidos);
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

function desenlaceDeBloqueo(
  pendientes: ReadonlyMap<string, CasoPendiente>,
  enviados: ReadonlySet<string>,
  caso: string,
  conocidos: PaquetesConocidos,
): DesenlaceEnvio {
  if (enviados.has(caso)) return { tipo: DESENLACE_ENVIO.YA_ENVIADO, caso };
  if (conocido(caso, conocidos, pendientes) === undefined) return { tipo: DESENLACE_ENVIO.SIN_PAQUETE, caso };
  return { tipo: DESENLACE_ENVIO.REQUIERE_CONFIRMACION, caso };
}

function desenlaceDeTruncadoConfirmado(
  pendientes: ReadonlyMap<string, CasoPendiente>,
  enviados: ReadonlySet<string>,
  caso: string,
  conocidos: PaquetesConocidos,
): DesenlaceEnvio {
  const desenlace = desenlaceDeBloqueo(pendientes, enviados, caso, conocidos);
  if (desenlace.tipo !== DESENLACE_ENVIO.REQUIERE_CONFIRMACION) return desenlace;
  return { tipo: DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, caso };
}

function desenlaceDeEvento(
  pendientes: ReadonlyMap<string, CasoPendiente>,
  enviados: ReadonlySet<string>,
  evento: EventoCompuerta,
  conocidos: PaquetesConocidos,
): DesenlaceEnvio | null {
  switch (evento.tipo) {
    case EVENTO_COMPUERTA.ARMADO:
    case EVENTO_COMPUERTA.ENVIADO:
      return null;
    case EVENTO_COMPUERTA.FALLIDO:
      return { tipo: DESENLACE_ENVIO.FALLIDO, caso: evento.caso };
    case EVENTO_COMPUERTA.BLOQUEADO:
      return desenlaceDeBloqueo(pendientes, enviados, evento.caso, conocidos);
    case EVENTO_COMPUERTA.TRUNCADO:
      if (evento.caso === null) return null;
      return desenlaceDeBloqueo(pendientes, enviados, evento.caso, conocidos);
    case EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO:
      return desenlaceDeTruncadoConfirmado(pendientes, enviados, evento.caso, conocidos);
  }
}

function casoIntentado(evento: EventoCompuerta): string | null {
  return evento.tipo === EVENTO_COMPUERTA.ARMADO ? null : evento.caso;
}

function reintentadoDespues(eventos: readonly EventoCompuerta[], indice: number, caso: string): boolean {
  return eventos.slice(indice + 1).some((evento) => casoIntentado(evento) === caso);
}

function casoDeTruncado(evento: EventoCompuerta | undefined): string | null {
  if (evento?.tipo === EVENTO_COMPUERTA.TRUNCADO || evento?.tipo === EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO) {
    return evento.caso;
  }
  return null;
}

function reemplazadoPorReintento(eventos: readonly EventoCompuerta[], indice: number): boolean {
  const caso = casoDeTruncado(eventos[indice]);
  return caso !== null && reintentadoDespues(eventos, indice, caso);
}

function desenlacesDeCasos(entrada: EntradaCierreCompuerta): readonly DesenlaceEnvio[] {
  const pendientes = new Map(entrada.arrastrados.map((pendiente) => [pendiente.caso, pendiente] as const));
  const enviados = new Set(entrada.enviados);
  const desenlaces: DesenlaceEnvio[] = [];
  for (const [indice, evento] of entrada.eventos.entries()) {
    const desenlace = reemplazadoPorReintento(entrada.eventos, indice)
      ? null
      : desenlaceDeEvento(pendientes, enviados, evento, entrada.conocidos);
    if (desenlace !== null) desenlaces.push(desenlace);
    aplicarEvento(pendientes, enviados, evento, entrada.conocidos);
  }
  return desenlaces;
}

function truncadoSinCaso(evento: EventoCompuerta): boolean {
  return evento.tipo === EVENTO_COMPUERTA.TRUNCADO && evento.caso === null;
}

function hayEnvioSinCaso(entrada: EntradaDesenlaces): boolean {
  return entrada.enviosSinCaso > 0 || entrada.eventos.some(truncadoSinCaso);
}

export function desenlacesDeEnvio(entrada: EntradaDesenlaces): readonly DesenlaceEnvio[] {
  if (entrada.abortado) return [];
  const sinCaso: readonly DesenlaceEnvio[] = hayEnvioSinCaso(entrada)
    ? [{ tipo: DESENLACE_ENVIO.SIN_CASO, caso: null }]
    : [];
  return [...desenlacesDeCasos(entrada), ...sinCaso];
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
