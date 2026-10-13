import { FORMATO, PLANTILLA_DEL_FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import type { TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import type { Formato, PlantillasPresentes } from "@/domain/types/solicitud.type.ts";

export function elegirPlantilla(formato: Formato, presentes: PlantillasPresentes): TipoPlantilla | null {
  const celdas = presentes[TIPO_PLANTILLA.CELDAS];
  const campos = presentes[TIPO_PLANTILLA.CAMPOS];
  if (celdas && campos) return PLANTILLA_DEL_FORMATO[formato];
  if (celdas) return TIPO_PLANTILLA.CELDAS;
  if (campos && formato !== FORMATO.XLSX) return TIPO_PLANTILLA.CAMPOS;
  return null;
}
