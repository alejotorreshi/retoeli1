import type { Instrucciones } from "@/application/types/puertos-agente.type.ts";
import {
  CODIGO_AGENTE,
  MOTIVO_FIN,
  SEPARADOR_PARRAFOS,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE, TEXTO_CONTEXTO } from "@/config/strings.ts";
import type { Mensaje, RespuestaLlm } from "@/llm/types/llm.type.ts";
import { anotarLlamadaLlm } from "@/loop/services/bitacora-turno.service.ts";
import {
  abortadoPorLlamante,
  cerrarSinError,
  cortar,
  fallar,
  fallarEnvio,
  interrumpido,
} from "@/loop/services/cierre-error.service.ts";
import { darPaso } from "@/loop/services/paso-herramientas.service.ts";
import {
  acumularUso,
  cierrePorPresupuesto,
  presupuestoAgotado,
} from "@/loop/services/presupuesto.service.ts";
import { cerrarPorTope } from "@/loop/services/tope-iteraciones.service.ts";
import type { Cierre, Ejecucion, Turno } from "@/loop/types/turno.type.ts";

function mensajesSistema(instrucciones: Instrucciones, fecha: string): readonly Mensaje[] {
  return [
    {
      rol: ROL_MENSAJE.SISTEMA,
      contenido: `${instrucciones.prompt}${SEPARADOR_PARRAFOS}${instrucciones.conocimiento}`,
    },
    { rol: ROL_MENSAJE.SISTEMA, contenido: TEXTO_CONTEXTO.fecha(fecha) },
  ];
}

async function* contarUso(turno: Turno, respuesta: RespuestaLlm, duracionMs: number): Ejecucion<void> {
  anotarLlamadaLlm(turno.bitacora, respuesta, duracionMs);
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

function mensajesDelTurno(turno: Turno, sistema: readonly Mensaje[]): readonly Mensaje[] {
  return [...sistema, ...turno.sesion.historial, turno.usuario, ...turno.pasos];
}

async function* cerrarAlTope(turno: Turno, sistema: readonly Mensaje[]): Ejecucion<Cierre> {
  const { deps } = turno;
  if (turno.signal.aborted) return yield* cortar(turno);
  const desde = Date.now();
  const tope = await cerrarPorTope(deps.llm, {
    mensajes: mensajesDelTurno(turno, sistema),
    definiciones: deps.herramientas.definiciones,
    signal: turno.signal,
    observador: turno.observador,
    llamadas: turno.llamadas,
    cabePresupuesto: !presupuestoAgotado(turno.sesion, deps.presupuestoTokens),
  });
  if (tope.respuesta !== null) yield* contarUso(turno, tope.respuesta, Date.now() - desde);
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
    const desde = Date.now();
    const resultado = await deps.llm.enviar(
      mensajesDelTurno(turno, sistema),
      deps.herramientas.definiciones,
      {
        signal: turno.signal,
        herramientasDesactivadas: false,
        observador: turno.observador,
      },
    );
    if (!resultado.ok) return yield* fallarEnvio(turno, resultado.error);
    const { respuesta } = resultado;
    yield* contarUso(turno, respuesta, Date.now() - desde);
    if (respuesta.llamadas.length === 0) {
      return cerrarSinError(MOTIVO_FIN.FINAL, respuesta.texto ?? "", respuesta.razonamiento);
    }
    const paso = yield* darPaso(turno, respuesta);
    if (paso === null) return yield* cortar(turno);
    turno.pasos.push(...paso);
  }
  return yield* cerrarAlTope(turno, sistema);
}

export async function* resolverTurno(turno: Turno): Ejecucion<Cierre> {
  if (presupuestoAgotado(turno.sesion, turno.deps.presupuestoTokens)) {
    return cerrarSinError(MOTIVO_FIN.TOPE_TOKENS, MENSAJE_AGENTE.PRESUPUESTO_AGOTADO);
  }
  const lectura = await turno.deps.instrucciones();
  if (!lectura.ok) return yield* fallar(turno, CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES);
  return yield* conversar(turno, mensajesSistema(lectura.instrucciones, turno.deps.reloj.hoy()));
}
