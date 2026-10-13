import { PREFIJO_RUTA_BANCARIA } from "@/config/constants/maestro.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN, TEXTO_SOPORTE } from "@/config/strings.ts";
import type {
  CasoChecklist,
  Checklist,
  DatosChecklist,
  FilaSoporteChecklist,
  MotivoBloqueo,
} from "@/domain/types/checklist.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

function motivoDe(soporte: SoporteEvaluado): readonly MotivoBloqueo[] {
  const { tipo } = soporte;
  if (soporte.estado === ESTADO_SOPORTE.AUSENTE) return [{ tipo, causa: ESTADO_SOPORTE.AUSENTE }];
  if (soporte.estado === ESTADO_SOPORTE.VENCIDO)
    return [
      {
        tipo,
        causa: ESTADO_SOPORTE.VENCIDO,
        vigencia: soporte.vigencia_hasta ?? TEXTO_CHECKLIST.sinVigencia,
      },
    ];
  return [];
}

function textoDeBloqueo(motivo: MotivoBloqueo, rotulo: (tipo: string) => string): string {
  if (motivo.causa === ESTADO_SOPORTE.AUSENTE) return TEXTO_CHECKLIST.bloqueoAusente(rotulo(motivo.tipo));
  return TEXTO_CHECKLIST.bloqueoVencido(rotulo(motivo.tipo), motivo.vigencia);
}

function idCrudo(tipo: string): string {
  return tipo;
}

export function motivosDeBloqueo(checklist: Pick<Checklist, "motivos_bloqueo">): readonly string[] {
  return checklist.motivos_bloqueo.map((motivo) => textoDeBloqueo(motivo, TEXTO_SOPORTE.nombre));
}

function esRutaBancaria(ruta: string | null): boolean {
  return ruta?.startsWith(PREFIJO_RUTA_BANCARIA) === true;
}

export function construirChecklist(
  soportes: readonly SoporteEvaluado[],
  campos: readonly CampoMapeado[],
  hoy: FechaISO,
): Checklist {
  const motivos = soportes.flatMap(motivoDe);
  const porConfirmar = campos.filter((campo) => campo.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION);
  return {
    fecha_ejecucion: hoy,
    listo_para_firma: motivos.length === 0,
    bloqueos: motivos.map((motivo) => textoDeBloqueo(motivo, idCrudo)),
    motivos_bloqueo: motivos,
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
    motivos: motivosDeBloqueo(checklist).map((motivo) => ({ motivo })),
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
