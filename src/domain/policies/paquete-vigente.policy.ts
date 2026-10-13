import { ARCHIVOS_PAQUETE, ARCHIVOS_SISTEMA_IGNORADOS } from "@/config/constants/files.constants.ts";
import { LIMITE_SOBRANTES_REPORTADOS } from "@/config/constants/limits.constants.ts";
import { PATRON_ARCHIVO_SOPORTE } from "@/config/constants/patterns.constants.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { DiferenciasPaquete, PaqueteEsperado, PaqueteReal } from "@/domain/types/paquete.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

export function soportesDelPaquete(soportes: readonly SoporteEvaluado[]): readonly string[] {
  return [...new Set(soportes.flatMap((soporte) => (soporte.archivo === null ? [] : [soporte.archivo])))];
}

export function archivosDelPaquete(
  checklist: Pick<Checklist, "soportes">,
  formulario: string,
): readonly string[] {
  return [
    ...new Set([formulario, ...soportesDelPaquete(checklist.soportes), ...Object.values(ARCHIVOS_PAQUETE)]),
  ];
}

function borradorDesactualizado(esperado: PaqueteEsperado, real: PaqueteReal): readonly string[] {
  return real.borrador !== null && real.borrador !== esperado.borrador
    ? [ARCHIVOS_PAQUETE.BORRADOR_CORREO]
    : [];
}

function sobrantesReportables(sobrantes: readonly string[]): readonly string[] {
  return sobrantes
    .filter((archivo) => PATRON_ARCHIVO_SOPORTE.test(archivo))
    .slice(0, LIMITE_SOBRANTES_REPORTADOS);
}

export function diferenciasDelPaquete(esperado: PaqueteEsperado, real: PaqueteReal): DiferenciasPaquete {
  const presentes = new Set(real.listado);
  const permitidos = new Set(esperado.archivos);
  const sobrantes = real.listado.filter(
    (archivo) => !permitidos.has(archivo) && !ARCHIVOS_SISTEMA_IGNORADOS.has(archivo),
  );
  const reportables = sobrantesReportables(sobrantes);
  return {
    archivos_faltantes: esperado.archivos.filter((archivo) => !presentes.has(archivo)),
    archivos_sobrantes: reportables,
    archivos_sobrantes_no_listados: sobrantes.length - reportables.length,
    archivos_desactualizados: borradorDesactualizado(esperado, real),
  };
}

export function paqueteAlDia(diferencias: DiferenciasPaquete): boolean {
  return (
    diferencias.archivos_faltantes.length === 0 &&
    diferencias.archivos_sobrantes.length === 0 &&
    diferencias.archivos_sobrantes_no_listados === 0 &&
    diferencias.archivos_desactualizados.length === 0
  );
}
