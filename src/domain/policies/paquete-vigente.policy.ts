import { ARCHIVOS_PAQUETE } from "@/config/constants/files.constants.ts";
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

export function diferenciasDelPaquete(esperado: PaqueteEsperado, real: PaqueteReal): DiferenciasPaquete {
  const presentes = new Set(real.listado);
  const permitidos = new Set(esperado.archivos);
  return {
    archivos_faltantes: esperado.archivos.filter((archivo) => !presentes.has(archivo)),
    archivos_sobrantes: real.listado.filter((archivo) => !permitidos.has(archivo)),
    archivos_desactualizados: borradorDesactualizado(esperado, real),
  };
}

export function paqueteAlDia(diferencias: DiferenciasPaquete): boolean {
  return Object.values(diferencias).every((archivos) => archivos.length === 0);
}
