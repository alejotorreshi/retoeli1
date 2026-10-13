import { MS_POR_DIA } from "@/config/constants/runtime.constants.ts";
import { ESTADO_VIGENCIA } from "@/config/constants/supports.constants.ts";
import { TEXTO_VIGENCIA } from "@/config/strings.ts";
import type { Vigencia } from "@/domain/types/vigencias.type.ts";

function textoVence(dias: number): string {
  if (dias === 0) return TEXTO_VIGENCIA.venceHoy;
  if (dias === 1) return TEXTO_VIGENCIA.venceEnUnDia;
  return TEXTO_VIGENCIA.venceEnDias(dias);
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / MS_POR_DIA);
}

export function evaluarVigencia(vigenciaHasta: string | null, hoy: string, diasAviso: number): Vigencia {
  if (vigenciaHasta === null) return { estado: ESTADO_VIGENCIA.VIGENTE, dias_restantes: null, aviso: null };
  const dias = diasEntre(hoy, vigenciaHasta);
  if (vigenciaHasta < hoy) return { estado: ESTADO_VIGENCIA.VENCIDO, dias_restantes: dias, aviso: null };
  const aviso = dias >= 0 && dias <= diasAviso ? textoVence(dias) : null;
  return { estado: ESTADO_VIGENCIA.VIGENTE, dias_restantes: dias, aviso };
}
