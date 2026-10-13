import { errorFromException } from "@/llm/mappers/provider-error.mapper.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  ErrorLlm,
  Mensaje,
  OpcionesEnvio,
  ResultadoEnvio,
} from "@/llm/types/llm.type.ts";
import type { OpcionesReintento } from "@/llm/types/resiliencia.type.ts";

const ABORTADO: ResultadoEnvio = { ok: false, error: errorFromException(true) };

function esperaPara(error: ErrorLlm, intento: number, opciones: OpcionesReintento): number {
  const exponencial = Math.min(opciones.topeMs, opciones.baseMs * 2 ** intento);
  return Math.min(opciones.topeMs, error.reintentarTrasMs ?? opciones.azar() * exponencial);
}

async function esperoSinAbortar(
  ms: number,
  reintento: OpcionesReintento,
  signal: AbortSignal,
): Promise<boolean> {
  try {
    await reintento.esperar(ms, signal);
  } catch {
    return false;
  }
  return !signal.aborted;
}

async function enviarConReintentos(
  base: AdaptadorLlm,
  reintento: OpcionesReintento,
  mensajes: readonly Mensaje[],
  herramientas: readonly DefinicionHerramienta[],
  opciones: OpcionesEnvio,
): Promise<ResultadoEnvio> {
  let resultado = await base.enviar(mensajes, herramientas, opciones);
  for (let intento = 0; intento < reintento.maxReintentos; intento += 1) {
    if (resultado.ok || !resultado.error.reintentable) return resultado;
    if (opciones.signal.aborted) return ABORTADO;
    const espera = esperaPara(resultado.error, intento, reintento);
    if (!(await esperoSinAbortar(espera, reintento, opciones.signal))) return ABORTADO;
    resultado = await base.enviar(mensajes, herramientas, opciones);
  }
  return resultado;
}

export function withRetry(base: AdaptadorLlm, reintento: OpcionesReintento): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: (mensajes, herramientas, opciones) =>
      enviarConReintentos(base, reintento, mensajes, herramientas, opciones),
  };
}
