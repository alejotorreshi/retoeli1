import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import { cierreDeterminista } from "@/domain/builders/cierre-turno.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { Uso } from "@/llm/types/llm.type.ts";
import type { Sesion } from "@/loop/types/turno.type.ts";

export function presupuestoAgotado(sesion: Sesion, tope: number): boolean {
  return sesion.tokensUsados >= tope;
}

export function acumularUso(sesion: Sesion, uso: Uso): Sesion {
  return { ...sesion, tokensUsados: sesion.tokensUsados + uso.entrada + uso.salida };
}

export function cierrePorPresupuesto(llamadas: readonly LlamadaResumida[]): string {
  return `${MENSAJE_AGENTE[CODIGO_AGENTE.PRESUPUESTO_AGOTADO]}${SEPARADOR_PARRAFOS}${cierreDeterminista(llamadas)}`;
}
