import type { Instrucciones } from "@/application/types/puertos-agente.type.ts";
import {
  CODIGO_AGENTE,
  CODIGO_AGENTE_POR_ERROR_LLM,
  MOTIVO_FIN,
  SEPARADOR_PARRAFOS,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { DECISION_CONFIRMACION, ESTADO_COMPUERTA } from "@/config/constants/confirmacion.constants.ts";
import { FIN_LLM, ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { MENSAJE_AGENTE, TEXTO_CONTEXTO, TEXTO_SESION } from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { abrirTurno, casosPendientes, estadoLibre } from "@/domain/policies/compuerta.policy.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type {
  AperturaTurno,
  AutorizacionTurno,
  CasoPendiente,
  EstadoCompuerta,
  EventoCompuerta,
} from "@/domain/types/compuerta.type.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";
import type {
  ErrorLlm,
  LlamadaHerramienta,
  Mensaje,
  MensajeAsistente,
  RespuestaLlm,
} from "@/llm/types/llm.type.ts";
import { cerrarTurnoConCompuerta } from "@/loop/services/cierre-turno.service.ts";
import { casoDeLlamada, despacharLlamada } from "@/loop/services/despacho-llamada.service.ts";
import {
  acumularUso,
  cierrePorPresupuesto,
  presupuestoAgotado,
} from "@/loop/services/presupuesto.service.ts";
import { argumentosDeLlamada } from "@/loop/services/registro-herramientas.service.ts";
import { cerrarPorTope } from "@/loop/services/tope-iteraciones.service.ts";
import type { CodigoAgente, EventoAgente, EventoInicioTurno, MotivoFin } from "@/loop/types/evento.type.ts";
import type {
  CierreTurnoCompuerta,
  DependenciasTurno,
  EntradaTurno,
  PaquetesConocidos,
  ResultadoLlamada,
  Sesion,
} from "@/loop/types/turno.type.ts";

type Cierre = {
  readonly motivo: MotivoFin;
  readonly texto: string;
  readonly razonamiento: string | null;
  readonly porError: boolean;
};

type Turno = {
  readonly turnoId: string;
  sesion: Sesion;
  readonly usuario: Mensaje;
  readonly pasos: Mensaje[];
  readonly signal: AbortSignal;
  readonly llamante: AbortSignal | null;
  readonly deps: DependenciasTurno;
  readonly arrastrados: readonly CasoPendiente[];
  readonly eventosCompuerta: EventoCompuerta[];
  readonly llamadas: LlamadaResumida[];
  autorizacion: AutorizacionTurno;
  conocidos: PaquetesConocidos;
  guardado: boolean;
};

type Ejecucion<R> = AsyncGenerator<EventoAgente, R>;

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

function mensajesSistema(instrucciones: Instrucciones, fecha: string): readonly Mensaje[] {
  return [
    {
      rol: ROL_MENSAJE.SISTEMA,
      contenido: `${instrucciones.prompt}${SEPARADOR_PARRAFOS}${instrucciones.conocimiento}`,
    },
    { rol: ROL_MENSAJE.SISTEMA, contenido: TEXTO_CONTEXTO.fecha(fecha) },
  ];
}

function mensajeAsistente(cierre: Cierre): MensajeAsistente {
  return {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: cierre.texto,
    llamadas: [],
    razonamiento: cierre.razonamiento,
  };
}

async function* fallar(turno: Turno, codigo: CodigoAgente): Ejecucion<Cierre> {
  const mensaje = MENSAJE_AGENTE[codigo];
  yield { tipo: TIPO_EVENTO.ERROR, turnoId: turno.turnoId, codigo, mensaje };
  return { motivo: MOTIVO_FIN.ERROR, texto: mensaje, razonamiento: null, porError: true };
}

function cerrarSinError(motivo: MotivoFin, texto: string, razonamiento: string | null = null): Cierre {
  return { motivo, texto, razonamiento, porError: false };
}

function interrumpido(): Cierre {
  return {
    motivo: MOTIVO_FIN.ABORTADO,
    texto: MENSAJE_AGENTE[CODIGO_AGENTE.TURNO_INTERRUMPIDO],
    razonamiento: null,
    porError: true,
  };
}

function abortadoPorLlamante(turno: Turno): boolean {
  return turno.llamante?.aborted ?? false;
}

async function* cortar(turno: Turno): Ejecucion<Cierre> {
  if (abortadoPorLlamante(turno)) return interrumpido();
  return yield* fallar(turno, CODIGO_AGENTE.TIEMPO_TURNO_AGOTADO);
}

async function* fallarEnvio(turno: Turno, error: ErrorLlm): Ejecucion<Cierre> {
  if (turno.signal.aborted) return yield* cortar(turno);
  return yield* fallar(turno, CODIGO_AGENTE_POR_ERROR_LLM[error.tipo]);
}

function herramientaDe(nombre: string): ValorDe<typeof HERRAMIENTA> | undefined {
  return Object.values(HERRAMIENTA).find((herramienta) => `${PREFIJO_HERRAMIENTA}${herramienta}` === nombre);
}

function resumida(llamada: LlamadaHerramienta, resultado: ResultadoLlamada): readonly LlamadaResumida[] {
  const herramienta = herramientaDe(llamada.nombre);
  if (herramienta === undefined) return [];
  return [{ herramienta, caso: casoDeLlamada(llamada), ok: resultado.ok, resumen: resultado.resumen }];
}

async function* contarUso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<void> {
  turno.sesion = acumularUso(turno.sesion, respuesta.uso);
  yield {
    tipo: TIPO_EVENTO.USO,
    turnoId: turno.turnoId,
    ...respuesta.uso,
    totalSesion: turno.sesion.tokensUsados,
    proveedor: respuesta.proveedor,
    modelo: respuesta.modelo,
  };
}

function asistenteDelPaso(respuesta: RespuestaLlm): MensajeAsistente {
  return {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: respuesta.texto,
    llamadas: respuesta.llamadas,
    razonamiento: respuesta.razonamiento,
  };
}

function pasoTruncado(respuesta: RespuestaLlm): readonly Mensaje[] {
  const codigo = CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS;
  const contenido = JSON.stringify({ ok: false, codigo, error: MENSAJE_AGENTE[codigo] });
  const respuestas: readonly Mensaje[] = respuesta.llamadas.map((llamada) => ({
    rol: ROL_MENSAJE.HERRAMIENTA,
    llamadaId: llamada.id,
    contenido,
  }));
  return [asistenteDelPaso(respuesta), ...respuestas];
}

async function* ejecutarPaso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<readonly Mensaje[] | null> {
  const respuestasHerramienta: Mensaje[] = [];
  for (const llamada of respuesta.llamadas) {
    const base = { turnoId: turno.turnoId, llamadaId: llamada.id, herramienta: llamada.nombre };
    yield {
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      ...base,
      argumentos: argumentosDeLlamada(llamada.argumentos),
    };
    if (turno.signal.aborted) return null;
    const despacho = await despacharLlamada(llamada, {
      registro: turno.deps.herramientas,
      registrar: turno.deps.registrar,
      directorio: turno.deps.directorio,
      sesionId: turno.sesion.id,
      autorizacion: turno.autorizacion,
      conocidos: turno.conocidos,
    });
    const { resultado, evento, paquete } = despacho;
    turno.autorizacion = despacho.autorizacion;
    turno.llamadas.push(...resumida(llamada, resultado));
    if (evento !== null) turno.eventosCompuerta.push(evento);
    if (paquete !== null) turno.conocidos = { ...turno.conocidos, [paquete.caso]: paquete };
    yield {
      tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
      ...base,
      ok: resultado.ok,
      codigo: resultado.codigo,
      resumen: resultado.resumen,
    };
    respuestasHerramienta.push({
      rol: ROL_MENSAJE.HERRAMIENTA,
      llamadaId: llamada.id,
      contenido: resultado.contenido,
    });
  }
  return [asistenteDelPaso(respuesta), ...respuestasHerramienta];
}

async function* darPaso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<readonly Mensaje[] | null> {
  if (respuesta.fin === FIN_LLM.LIMITE) return pasoTruncado(respuesta);
  return yield* ejecutarPaso(turno, respuesta);
}

function mensajesDelTurno(turno: Turno, sistema: readonly Mensaje[]): readonly Mensaje[] {
  return [...sistema, ...turno.sesion.historial, turno.usuario, ...turno.pasos];
}

async function* cerrarAlTope(turno: Turno, sistema: readonly Mensaje[]): Ejecucion<Cierre> {
  const { deps } = turno;
  if (turno.signal.aborted) return yield* cortar(turno);
  const tope = await cerrarPorTope(deps.llm, {
    mensajes: mensajesDelTurno(turno, sistema),
    definiciones: deps.herramientas.definiciones,
    signal: turno.signal,
    llamadas: turno.llamadas,
    cabePresupuesto: !presupuestoAgotado(turno.sesion, deps.presupuestoTokens),
  });
  if (tope.respuesta !== null) yield* contarUso(turno, tope.respuesta);
  if (abortadoPorLlamante(turno)) return interrumpido();
  return cerrarSinError(MOTIVO_FIN.TOPE_ITERACIONES, tope.texto);
}

async function* conversar(turno: Turno, sistema: readonly Mensaje[]): Ejecucion<Cierre> {
  const { deps } = turno;
  for (let iteracion = 0; iteracion < deps.maxIteraciones; iteracion += 1) {
    if (turno.signal.aborted) return yield* cortar(turno);
    if (presupuestoAgotado(turno.sesion, deps.presupuestoTokens)) {
      return cerrarSinError(MOTIVO_FIN.TOPE_TOKENS, cierrePorPresupuesto(turno.llamadas));
    }
    const resultado = await deps.llm.enviar(
      mensajesDelTurno(turno, sistema),
      deps.herramientas.definiciones,
      {
        signal: turno.signal,
        herramientasDesactivadas: false,
      },
    );
    if (!resultado.ok) return yield* fallarEnvio(turno, resultado.error);
    const { respuesta } = resultado;
    yield* contarUso(turno, respuesta);
    if (respuesta.llamadas.length === 0) {
      return cerrarSinError(MOTIVO_FIN.FINAL, respuesta.texto ?? "", respuesta.razonamiento);
    }
    const paso = yield* darPaso(turno, respuesta);
    if (paso === null) return yield* cortar(turno);
    turno.pasos.push(...paso);
  }
  return yield* cerrarAlTope(turno, sistema);
}

async function* resolverTurno(turno: Turno): Ejecucion<Cierre> {
  if (presupuestoAgotado(turno.sesion, turno.deps.presupuestoTokens)) {
    return cerrarSinError(MOTIVO_FIN.TOPE_TOKENS, MENSAJE_AGENTE.PRESUPUESTO_AGOTADO);
  }
  const lectura = await turno.deps.instrucciones();
  if (!lectura.ok) return yield* fallar(turno, CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES);
  return yield* conversar(turno, mensajesSistema(lectura.instrucciones, turno.deps.reloj.hoy()));
}

function cerrarCompuerta(turno: Turno, cierre: Cierre): CierreTurnoCompuerta {
  return cerrarTurnoConCompuerta({
    turnoId: turno.turnoId,
    texto: cierre.porError ? "" : cierre.texto,
    arrastrados: turno.arrastrados,
    eventos: turno.eventosCompuerta,
    conocidos: turno.conocidos,
    abortado: cierre.motivo === MOTIVO_FIN.ABORTADO,
  });
}

function textoGuardado(cierre: Cierre, compuerta: CierreTurnoCompuerta): string {
  if (!cierre.porError) return compuerta.texto;
  return compuerta.texto === "" ? cierre.texto : `${cierre.texto}${SEPARADOR_PARRAFOS}${compuerta.texto}`;
}

function guardarSesion(turno: Turno, cierre: Cierre, compuerta: CierreTurnoCompuerta): void {
  turno.guardado = true;
  const asistente = mensajeAsistente({ ...cierre, texto: textoGuardado(cierre, compuerta) });
  turno.deps.sesiones.guardar({
    ...turno.sesion,
    historial: [...turno.sesion.historial, turno.usuario, ...turno.pasos, asistente],
    compuerta: compuerta.estado,
    paquetesConocidos: turno.conocidos,
  });
}

function guardarInterrumpido(turno: Turno): void {
  const cierre = interrumpido();
  guardarSesion(turno, cierre, cerrarCompuerta(turno, cierre));
}

async function* emitirCierre(turno: Turno, cierre: Cierre, compuerta: CierreTurnoCompuerta): Ejecucion<void> {
  if (!cierre.porError || compuerta.texto !== "") {
    yield { tipo: TIPO_EVENTO.TEXTO, turnoId: turno.turnoId, texto: compuerta.texto };
  }
  yield* compuerta.eventosConfirmacion;
}

async function* rechazarOcupada(inicio: EventoInicioTurno): Ejecucion<void> {
  const codigo = CODIGO_AGENTE.SESION_OCUPADA;
  yield inicio;
  yield { tipo: TIPO_EVENTO.ERROR, turnoId: inicio.turnoId, codigo, mensaje: MENSAJE_AGENTE[codigo] };
  yield {
    tipo: TIPO_EVENTO.FIN_TURNO,
    turnoId: inicio.turnoId,
    motivo: MOTIVO_FIN.ERROR,
    needsConfirmation: false,
  };
}

type Desenlace = { readonly motivo: MotivoFin; readonly needsConfirmation: boolean };

async function* atender(turno: Turno, inicio: EventoInicioTurno): Ejecucion<Desenlace> {
  yield inicio;
  if (inicio.sesionExpirada) {
    yield { tipo: TIPO_EVENTO.TEXTO, turnoId: turno.turnoId, texto: TEXTO_SESION.expirada };
  }
  const cierre = yield* resolverTurno(turno);
  const compuerta = cerrarCompuerta(turno, cierre);
  guardarSesion(turno, cierre, compuerta);
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
  if (!deps.sesiones.ocupar(sesionId)) return yield* rechazarOcupada(inicio);
  const { sesion } = abierta;
  const plazo = AbortSignal.timeout(deps.deadlineMs);
  const llamante = entrada.signal ?? null;
  const apertura = abrirTurno(sesion.compuerta, decisionDe(entrada, sesion.compuerta));
  const turno: Turno = {
    turnoId,
    sesion,
    usuario: { rol: ROL_MENSAJE.USUARIO, contenido: entrada.mensaje },
    pasos: [],
    signal: AbortSignal.any(llamante === null ? [plazo] : [llamante, plazo]),
    llamante,
    deps,
    arrastrados: arrastradosDe(apertura),
    eventosCompuerta: [],
    llamadas: [],
    autorizacion: { caso: apertura.autorizado, usada: false },
    conocidos: sesion.paquetesConocidos,
    guardado: false,
  };
  let desenlace: Desenlace;
  try {
    desenlace = yield* atender(turno, inicio);
  } finally {
    if (!turno.guardado) guardarInterrumpido(turno);
    deps.sesiones.liberar(sesionId);
  }
  yield { tipo: TIPO_EVENTO.FIN_TURNO, turnoId, ...desenlace };
}
