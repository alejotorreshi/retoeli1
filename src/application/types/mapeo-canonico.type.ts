import type { CampoPresentado } from "@/domain/types/pii.type.ts";

export type DocumentoMapeo = {
  readonly caso: string;
  readonly pais: string;
  readonly fecha_ejecucion: string;
  readonly campos: readonly CampoPresentado[];
};
