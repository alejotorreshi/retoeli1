import type { CampoPorConfirmar } from "@/domain/types/checklist.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

export type ArgsArmarPaquete = { readonly caso: string };

export type ResumenChecklist = {
  readonly fecha_ejecucion: string;
  readonly soportes: readonly SoporteEvaluado[];
  readonly faltantes: readonly string[];
  readonly requiere_confirmacion: readonly CampoPorConfirmar[];
};

export type DatosPaquete = {
  readonly caso: string;
  readonly ruta: string;
  readonly listo_para_firma: boolean;
  readonly bloqueos: readonly string[];
  readonly checklist: ResumenChecklist;
  readonly archivos: readonly string[];
};
