import { CODIGO_AGENTE, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ARGUMENTOS_VACIOS, FIN_LLM, ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA_POR_NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import { cuerpoDeFallo } from "@/domain/utils/respuesta-herramienta.util.ts";
import type { LlamadaHerramienta, Mensaje, MensajeAsistente, RespuestaLlm } from "@/llm/types/llm.type.ts";
import { anotarHerramienta } from "@/loop/services/bitacora-turno.service.ts";
import { casoDeLlamada, despacharLlamada } from "@/loop/services/despacho-llamada.service.ts";
import { argumentosDeLlamada } from "@/loop/services/registro-herramientas.service.ts";
import type { Ejecucion, ResultadoLlamada, Turno } from "@/loop/types/turno.type.ts";

function resumida(llamada: LlamadaHerramienta, resultado: ResultadoLlamada): readonly LlamadaResumida[] {
  const herramienta = HERRAMIENTA_POR_NOMBRE_VISIBLE.get(llamada.nombre);
  if (herramienta === undefined) return [];
  return [{ herramienta, caso: casoDeLlamada(llamada), ok: resultado.ok, resumen: resultado.resumen }];
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
  const contenido = JSON.stringify(cuerpoDeFallo({ codigo, error: MENSAJE_AGENTE[codigo] }, null));
  const llamadas = respuesta.llamadas.map((llamada) => ({ ...llamada, argumentos: ARGUMENTOS_VACIOS }));
  const respuestas: readonly Mensaje[] = llamadas.map((llamada) => ({
    rol: ROL_MENSAJE.HERRAMIENTA,
    llamadaId: llamada.id,
    contenido,
  }));
  return [{ ...asistenteDelPaso(respuesta), llamadas }, ...respuestas];
}

async function* ejecutarPaso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<readonly Mensaje[] | null> {
  const respuestasHerramienta: Mensaje[] = [];
  for (const llamada of respuesta.llamadas) {
    const base = { turnoId: turno.turnoId, llamadaId: llamada.id, herramienta: llamada.nombre };
    yield {
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      ...base,
      argumentos: redactar(argumentosDeLlamada(llamada.argumentos), turno.deps.secretos),
    };
    if (turno.signal.aborted) return null;
    const desde = Date.now();
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
    anotarHerramienta(turno.bitacora, llamada, despacho, turno.conocidos, Date.now() - desde);
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

export async function* darPaso(turno: Turno, respuesta: RespuestaLlm): Ejecucion<readonly Mensaje[] | null> {
  if (respuesta.fin === FIN_LLM.LIMITE) return pasoTruncado(respuesta);
  return yield* ejecutarPaso(turno, respuesta);
}
