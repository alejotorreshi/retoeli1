import type { Checklist } from "@/domain/types/checklist.type.ts";

function archivosEsperados(checklist: Checklist, formulario: string): readonly string[] {
  const soportes = checklist.soportes.flatMap((soporte) =>
    soporte.archivo === null ? [] : [soporte.archivo],
  );
  return [...new Set([formulario, ...soportes])];
}

export function archivosFaltantesEnPaquete(
  checklist: Checklist,
  formulario: string,
  listado: readonly string[],
): readonly string[] {
  const presentes = new Set(listado);
  return archivosEsperados(checklist, formulario).filter((archivo) => !presentes.has(archivo));
}
