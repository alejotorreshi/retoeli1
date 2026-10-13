import { PREFIJO_RUTA_BANCARIA } from "@/config/constants/maestro.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN, TEXTO_SOPORTE } from "@/config/strings.ts";
import type {
  CasoChecklist,
  Checklist,
  DatosChecklist,
  FilaSoporteChecklist,
} from "@/domain/types/checklist.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

function bloqueoDe(soporte: SoporteEvaluado, rotulo: (tipo: string) => string): readonly string[] {
  if (soporte.estado === ESTADO_SOPORTE.AUSENTE)
    return [TEXTO_CHECKLIST.bloqueoAusente(rotulo(soporte.tipo))];
  if (soporte.estado === ESTADO_SOPORTE.VENCIDO)
    return [
      TEXTO_CHECKLIST.bloqueoVencido(
        rotulo(soporte.tipo),
        soporte.vigencia_hasta ?? TEXTO_CHECKLIST.sinVigencia,
      ),
    ];
  return [];
}

function idCrudo(tipo: string): string {
  return tipo;
}

function bloqueosDe(
  soportes: readonly SoporteEvaluado[],
  rotulo: (tipo: string) => string,
): readonly string[] {
  return soportes.flatMap((soporte) => bloqueoDe(soporte, rotulo));
}

export function motivosDeBloqueo(soportes: readonly SoporteEvaluado[]): readonly string[] {
  return bloqueosDe(soportes, TEXTO_SOPORTE.nombre);
}

function esRutaBancaria(ruta: string | null): boolean {
  return ruta?.startsWith(PREFIJO_RUTA_BANCARIA) === true;
}

export function construirChecklist(
  soportes: readonly SoporteEvaluado[],
  campos: readonly CampoMapeado[],
  hoy: FechaISO,
): Checklist {
  const bloqueos = bloqueosDe(soportes, idCrudo);
  const porConfirmar = campos.filter((campo) => campo.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION);
  return {
    fecha_ejecucion: hoy,
    listo_para_firma: bloqueos.length === 0,
    bloqueos,
    soportes,
    faltantes: campos
      .filter((campo) => campo.estado === ESTADO_CAMPO.FALTANTE)
      .map((campo) => campo.etiqueta),
    requiere_confirmacion: porConfirmar.map((campo) => ({
      etiqueta: campo.etiqueta,
      nota: campo.nota ?? TEXTO_COMUN.porConfirmar,
    })),
    confirmaciones_al_cliente: porConfirmar
      .filter((campo) => !esRutaBancaria(campo.ruta))
      .map((campo) => campo.etiqueta),
  };
}

function vigenciaVisible(soporte: SoporteEvaluado): string {
  if (soporte.estado === ESTADO_SOPORTE.AUSENTE) return TEXTO_COMUN.celdaVacia;
  return soporte.vigencia_hasta ?? TEXTO_CHECKLIST.sinVigencia;
}

function filaSoporte(soporte: SoporteEvaluado): FilaSoporteChecklist {
  return {
    nombre: TEXTO_SOPORTE.nombre(soporte.tipo),
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
    motivos: motivosDeBloqueo(soportes).map((motivo) => ({ motivo })),
    soportes: soportes.map(filaSoporte),
    faltantes: checklist.faltantes.map((etiqueta) => ({ etiqueta })),
    por_confirmar: checklist.requiere_confirmacion,
    ausentes: soportes
      .filter((soporte) => soporte.estado === ESTADO_SOPORTE.AUSENTE)
      .map(({ tipo }) => ({ nombre: TEXTO_SOPORTE.nombre(tipo) })),
    vencidos: soportes
      .filter((soporte) => soporte.estado === ESTADO_SOPORTE.VENCIDO)
      .map((soporte) => ({ nombre: TEXTO_SOPORTE.nombre(soporte.tipo), vigencia: vigenciaVisible(soporte) })),
  };
}
