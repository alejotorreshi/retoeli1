import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN } from "@/config/strings.ts";
import type {
  CasoChecklist,
  Checklist,
  DatosChecklist,
  FilaSoporteChecklist,
} from "@/domain/types/checklist.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

function bloqueoDe(soporte: SoporteEvaluado): readonly string[] {
  if (soporte.estado === ESTADO_SOPORTE.AUSENTE) return [TEXTO_CHECKLIST.bloqueoAusente(soporte.tipo)];
  if (soporte.estado === ESTADO_SOPORTE.VENCIDO)
    return [TEXTO_CHECKLIST.bloqueoVencido(soporte.tipo, soporte.vigencia_hasta ?? "")];
  return [];
}

export function construirChecklist(
  soportes: readonly SoporteEvaluado[],
  campos: readonly CampoMapeado[],
  hoy: FechaISO,
): Checklist {
  const bloqueos = soportes.flatMap(bloqueoDe);
  return {
    fecha_ejecucion: hoy,
    listo_para_firma: bloqueos.length === 0,
    bloqueos,
    soportes,
    faltantes: campos
      .filter((campo) => campo.estado === ESTADO_CAMPO.FALTANTE)
      .map((campo) => campo.etiqueta),
    requiere_confirmacion: campos
      .filter((campo) => campo.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION)
      .map((campo) => ({ etiqueta: campo.etiqueta, nota: campo.nota ?? TEXTO_COMUN.porConfirmar })),
  };
}

function vigenciaVisible(soporte: SoporteEvaluado): string {
  if (soporte.estado === ESTADO_SOPORTE.AUSENTE) return TEXTO_COMUN.celdaVacia;
  return soporte.vigencia_hasta ?? TEXTO_CHECKLIST.sinVigencia;
}

function filaSoporte(soporte: SoporteEvaluado): FilaSoporteChecklist {
  return {
    tipo: soporte.tipo,
    archivo: soporte.archivo ?? TEXTO_COMUN.celdaVacia,
    vigencia: vigenciaVisible(soporte),
    estado: soporte.estado,
    aviso: soporte.aviso ?? TEXTO_COMUN.celdaVacia,
    pais_emisor: soporte.pais_emisor ?? TEXTO_COMUN.celdaVacia,
    aviso_emisor: soporte.aviso_emisor ?? TEXTO_COMUN.celdaVacia,
  };
}

export function construirDatosChecklist(caso: CasoChecklist, checklist: Checklist): DatosChecklist {
  const { soportes } = checklist;
  return {
    caso: caso.caso,
    cliente: caso.cliente,
    fecha_ejecucion: checklist.fecha_ejecucion,
    estado: checklist.listo_para_firma ? TEXTO_CHECKLIST.estado.listo : TEXTO_CHECKLIST.estado.bloqueado,
    motivos: checklist.bloqueos.map((motivo) => ({ motivo })),
    soportes: soportes.map(filaSoporte),
    faltantes: checklist.faltantes.map((etiqueta) => ({ etiqueta })),
    por_confirmar: checklist.requiere_confirmacion,
    ausentes: soportes
      .filter((soporte) => soporte.estado === ESTADO_SOPORTE.AUSENTE)
      .map(({ tipo }) => ({ tipo })),
    vencidos: soportes
      .filter((soporte) => soporte.estado === ESTADO_SOPORTE.VENCIDO)
      .map((soporte) => ({ tipo: soporte.tipo, vigencia: vigenciaVisible(soporte) })),
  };
}
