import {
  CODIGO_AGENTE,
  CODIGO_AGENTE_POR_ERROR_LLM,
  MOTIVO_FIN,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { ErrorLlm } from "@/llm/types/llm.type.ts";
import type { CodigoAgente, MotivoFin } from "@/loop/types/evento.type.ts";
import type { Cierre, Ejecucion, Turno } from "@/loop/types/turno.type.ts";

export async function* fallar(turno: Turno, codigo: CodigoAgente): Ejecucion<Cierre> {
  const mensaje = MENSAJE_AGENTE[codigo];
  yield { tipo: TIPO_EVENTO.ERROR, turnoId: turno.turnoId, codigo, mensaje };
  return { motivo: MOTIVO_FIN.ERROR, texto: mensaje, razonamiento: null, porError: true, codigo };
}

export function cerrarSinError(motivo: MotivoFin, texto: string, razonamiento: string | null = null): Cierre {
  return { motivo, texto, razonamiento, porError: false, codigo: null };
}

export function interrumpido(): Cierre {
  return {
    motivo: MOTIVO_FIN.ABORTADO,
    texto: MENSAJE_AGENTE[CODIGO_AGENTE.TURNO_INTERRUMPIDO],
    razonamiento: null,
    porError: true,
    codigo: CODIGO_AGENTE.TURNO_INTERRUMPIDO,
  };
}

export function abortadoPorLlamante(turno: Turno): boolean {
  return turno.llamante?.aborted ?? false;
}

export async function* cortar(turno: Turno): Ejecucion<Cierre> {
  if (abortadoPorLlamante(turno)) return interrumpido();
  return yield* fallar(turno, CODIGO_AGENTE.TIEMPO_TURNO_AGOTADO);
}

export async function* fallarEnvio(turno: Turno, error: ErrorLlm): Ejecucion<Cierre> {
  if (turno.signal.aborted) return yield* cortar(turno);
  return yield* fallar(turno, CODIGO_AGENTE_POR_ERROR_LLM[error.tipo]);
}
