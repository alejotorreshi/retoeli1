import type { Instrucciones } from "@/application/types/puertos-agente.type.ts";
import {
  CODIGO_AGENTE,
  CODIGO_AGENTE_POR_ERROR_LLM,
  MOTIVO_FIN,
  SEPARADOR_PARRAFOS,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { Mensaje, MensajeAsistente, RespuestaLlm } from "@/llm/types/llm.type.ts";
import { argumentosDeLlamada } from "@/loop/services/registro-herramientas.service.ts";
import type { CodigoAgente, EventoAgente, MotivoFin } from "@/loop/types/evento.type.ts";
import type { DependenciasTurno, EntradaTurno, Sesion } from "@/loop/types/turno.type.ts";

type Cierre = { readonly motivo: MotivoFin; readonly texto: string; readonly razonamiento: string | null };

type Turno = {
  readonly turnoId: string;
  readonly sesion: Sesion;
  readonly usuario: Mensaje;
  readonly pasos: Mensaje[];
  readonly signal: AbortSignal;
  readonly deps: DependenciasTurno;
  tokensUsados: number;
};

type Ejecucion<R> = AsyncGenerator<EventoAgente, R>;

export function sesionVacia(id: string): Sesion {
  return { id, historial: [], tokensUsados: 0 };
}

function mensajeSistema(instrucciones: Instrucciones): Mensaje {
  return {
    rol: ROL_MENSAJE.SISTEMA,
    contenido: `${instrucciones.prompt}${SEPARADOR_PARRAFOS}${instrucciones.conocimiento}`,
  };
}

function mensajeAsistente(cierre: Cierre): MensajeAsistente {
  return {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: cierre.texto,
    llamadas: [],
    razonamiento: cierre.razonamiento,
  };
}

async function* fallar(
  turno: Turno,
  codigo: CodigoAgente,
  motivo: MotivoFin = MOTIVO_FIN.ERROR,
): Ejecucion<Cierre> {
  const mensaje = MENSAJE_AGENTE[codigo];
  yield { tipo: TIPO_EVENTO.ERROR, turnoId: turno.turnoId, codigo, mensaje };
  return { motivo, texto: mensaje, razonamiento: null };
}

async function* ejecutarPaso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<readonly Mensaje[]> {
  const respuestasHerramienta: Mensaje[] = [];
  for (const llamada of respuesta.llamadas) {
    const base = { turnoId: turno.turnoId, llamadaId: llamada.id, herramienta: llamada.nombre };
    yield {
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      ...base,
      argumentos: argumentosDeLlamada(llamada.argumentos),
    };
    const resultado = await turno.deps.herramientas.ejecutar(llamada, {
      directory: turno.deps.directorio,
      sessionId: turno.sesion.id,
    });
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
  const asistente: MensajeAsistente = {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: respuesta.texto,
    llamadas: respuesta.llamadas,
    razonamiento: respuesta.razonamiento,
  };
  return [asistente, ...respuestasHerramienta];
}

async function* conversar(turno: Turno, sistema: Mensaje): Ejecucion<Cierre> {
  const { deps } = turno;
  for (let iteracion = 0; iteracion < deps.maxIteraciones; iteracion += 1) {
    const mensajes = [sistema, ...turno.sesion.historial, turno.usuario, ...turno.pasos];
    const resultado = await deps.llm.enviar(mensajes, deps.herramientas.definiciones, {
      signal: turno.signal,
      herramientasDesactivadas: false,
    });
    if (!resultado.ok) return yield* fallar(turno, CODIGO_AGENTE_POR_ERROR_LLM[resultado.error.tipo]);
    const { respuesta } = resultado;
    turno.tokensUsados += respuesta.uso.entrada + respuesta.uso.salida;
    yield {
      tipo: TIPO_EVENTO.USO,
      turnoId: turno.turnoId,
      ...respuesta.uso,
      totalSesion: turno.tokensUsados,
      proveedor: respuesta.proveedor,
      modelo: respuesta.modelo,
    };
    if (respuesta.llamadas.length === 0) {
      const texto = respuesta.texto ?? "";
      yield { tipo: TIPO_EVENTO.TEXTO, turnoId: turno.turnoId, texto };
      return { motivo: MOTIVO_FIN.FINAL, texto, razonamiento: respuesta.razonamiento };
    }
    turno.pasos.push(...(yield* ejecutarPaso(turno, respuesta)));
  }
  return yield* fallar(turno, CODIGO_AGENTE.TOPE_ITERACIONES, MOTIVO_FIN.TOPE_ITERACIONES);
}

async function* resolverTurno(turno: Turno): Ejecucion<Cierre> {
  const lectura = await turno.deps.instrucciones();
  if (!lectura.ok) return yield* fallar(turno, CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES);
  return yield* conversar(turno, mensajeSistema(lectura.instrucciones));
}

function guardarSesion(turno: Turno, cierre: Cierre): void {
  turno.deps.sesiones.guardar({
    ...turno.sesion,
    historial: [...turno.sesion.historial, turno.usuario, ...turno.pasos, mensajeAsistente(cierre)],
    tokensUsados: turno.tokensUsados,
  });
}

export async function* ejecutarTurno(entrada: EntradaTurno, deps: DependenciasTurno): Ejecucion<void> {
  const turnoId = deps.nuevoId();
  const abierta = deps.sesiones.abrir(entrada.sesionId);
  const turno: Turno = {
    turnoId,
    sesion: abierta.sesion,
    usuario: { rol: ROL_MENSAJE.USUARIO, contenido: entrada.mensaje },
    pasos: [],
    signal: entrada.signal ?? new AbortController().signal,
    deps,
    tokensUsados: abierta.sesion.tokensUsados,
  };
  yield {
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: abierta.sesion.id,
    turnoId,
    sesionNueva: abierta.nueva,
    sesionExpirada: abierta.expirada,
  };
  const cierre = yield* resolverTurno(turno);
  guardarSesion(turno, cierre);
  yield { tipo: TIPO_EVENTO.FIN_TURNO, turnoId, motivo: cierre.motivo, needsConfirmation: false };
}
