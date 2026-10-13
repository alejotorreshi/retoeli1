import { ESTADO_CAMPO, NOMBRE_TEXTO_REGLA, VARIABLE_NOTA } from "@/config/constants/mapping.constants.ts";
import {
  ESTADO_SOPORTE,
  ESTADO_VIGENCIA,
  VIGENCIA_SIN_VENCIMIENTO,
} from "@/config/constants/supports.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN } from "@/config/strings.ts";
import { renderizarTextoPlano } from "@/domain/plantillas.ts";
import { exito } from "@/domain/resultado.ts";
import type {
  CasoChecklist,
  Checklist,
  DatosChecklist,
  FilaSoporteChecklist,
  SoporteEvaluado,
  SoporteIndice,
} from "@/domain/types/checklist.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { ReglasSoportes } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { evaluarVigencia } from "@/domain/vigencias.ts";

function avisoEmisor(
  entrada: SoporteIndice,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<string | null> {
  if (entrada.pais_emisor === paisCliente) return exito(null);
  return renderizarTextoPlano(
    reglas.aviso_emisor_distinto,
    { [VARIABLE_NOTA.PAIS_EMISOR]: entrada.pais_emisor },
    NOMBRE_TEXTO_REGLA.AVISO_EMISOR,
  );
}

function soporteAusente(tipo: string): SoporteEvaluado {
  return {
    tipo,
    estado: ESTADO_SOPORTE.AUSENTE,
    vigencia_hasta: null,
    archivo: null,
    aviso: null,
    aviso_emisor: null,
  };
}

function vigenciaComparable(entrada: SoporteIndice): string {
  return entrada.vigencia_hasta ?? VIGENCIA_SIN_VENCIMIENTO;
}

function masVigentePrimero(a: SoporteIndice, b: SoporteIndice): number {
  return vigenciaComparable(b).localeCompare(vigenciaComparable(a)) || a.archivo.localeCompare(b.archivo);
}

function entradaMasVigente(
  tipo: string,
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
): SoporteIndice | undefined {
  return indice
    .filter((candidata) => candidata.tipo === tipo && presentes.has(candidata.archivo))
    .sort(masVigentePrimero)[0];
}

function evaluarSoporte(
  tipo: string,
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
  hoy: FechaISO,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<SoporteEvaluado> {
  const entrada = entradaMasVigente(tipo, indice, presentes);
  if (entrada === undefined) return exito(soporteAusente(tipo));
  const vigencia = evaluarVigencia(entrada.vigencia_hasta, hoy, reglas.dias_aviso_vencimiento);
  const emisor = avisoEmisor(entrada, paisCliente, reglas);
  if (!emisor.ok) return emisor;
  return exito({
    tipo,
    estado: vigencia.estado === ESTADO_VIGENCIA.VENCIDO ? ESTADO_SOPORTE.VENCIDO : ESTADO_SOPORTE.PRESENTE,
    vigencia_hasta: entrada.vigencia_hasta,
    archivo: entrada.archivo,
    aviso: vigencia.aviso,
    aviso_emisor: emisor.data,
  });
}

export function evaluarSoportes(
  exigidos: readonly string[],
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
  hoy: FechaISO,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<readonly SoporteEvaluado[]> {
  const evaluados: SoporteEvaluado[] = [];
  for (const tipo of exigidos) {
    const soporte = evaluarSoporte(tipo, indice, presentes, hoy, paisCliente, reglas);
    if (!soporte.ok) return soporte;
    evaluados.push(soporte.data);
  }
  return exito(evaluados);
}

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
    pais_emisor: soporte.aviso_emisor ?? TEXTO_COMUN.celdaVacia,
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
