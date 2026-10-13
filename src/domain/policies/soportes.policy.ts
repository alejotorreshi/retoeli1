import { NOMBRE_TEXTO_REGLA, VARIABLE_NOTA } from "@/config/constants/mapping.constants.ts";
import {
  ESTADO_SOPORTE,
  ESTADO_VIGENCIA,
  VIGENCIA_SIN_VENCIMIENTO,
} from "@/config/constants/supports.constants.ts";
import { renderizarTextoPlano } from "@/domain/engines/motor-plantillas.engine.ts";
import { evaluarVigencia } from "@/domain/policies/vigencias.policy.ts";
import type {
  EntradaEvaluacionSoportes,
  SoporteEvaluado,
  SoporteIndice,
} from "@/domain/types/checklist.type.ts";
import type { ReglasSoportes } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito } from "@/domain/utils/resultado.util.ts";

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
    pais_emisor: null,
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

function evaluarSoporte(tipo: string, evaluacion: EntradaEvaluacionSoportes): Resultado<SoporteEvaluado> {
  const { indice, presentes, hoy, paisCliente, reglas } = evaluacion;
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
    pais_emisor: entrada.pais_emisor,
    aviso_emisor: emisor.data,
  });
}

export function evaluarSoportes(
  evaluacion: EntradaEvaluacionSoportes,
): Resultado<readonly SoporteEvaluado[]> {
  const evaluados: SoporteEvaluado[] = [];
  for (const tipo of evaluacion.exigidos) {
    const soporte = evaluarSoporte(tipo, evaluacion);
    if (!soporte.ok) return soporte;
    evaluados.push(soporte.data);
  }
  return exito(evaluados);
}
